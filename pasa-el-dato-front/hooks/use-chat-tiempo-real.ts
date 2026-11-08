"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  io,
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from "socket.io-client";
import type { MensajeWsDTO } from "@/domain/dtos/chat.dto";
import {
  LIMITE_MENSAJES_WEB,
  NAMESPACE_CHAT,
  RUTA_SOCKET_CHAT,
} from "@/lib/api/chat";

interface SincronizacionChat {
  conversacionId: string;
  items: MensajeWsDTO[];
  nextCursor: string | null;
}

function esObjectIdValido(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

function extraerMensajeErrorWs(error: unknown): string {
  if (error && typeof error === "object") {
    const posible = error as { status?: unknown; message?: unknown };
    if (typeof posible.message === "string" && posible.message.trim()) {
      // socket.io-client rechaza los ack pendientes cuando cae el socket.
      if (posible.message === "socket has been disconnected") {
        return "Se cerró la conexión con el chat. Reintenta.";
      }
      return posible.message;
    }
    // WsException serializado como { message: { status, message } }.
    const interno = posible.message as { message?: unknown } | undefined;
    if (
      interno &&
      typeof interno === "object" &&
      typeof interno.message === "string" &&
      interno.message.trim()
    ) {
      return interno.message;
    }
  }
  if (typeof error === "string" && error.trim()) return error;
  return "No pudimos completar la operación de chat. Reintenta.";
}

const MENSAJE_SESION_EXPIRADA = "Tu sesión expiró. Inicia sesión nuevamente.";
const MENSAJE_CONTENIDO_NO_PERMITIDO =
  "No se pudo enviar por contenido no permitido.";

class ErrorContenidoNoPermitido extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrorContenidoNoPermitido";
  }
}

interface EnvioPendiente {
  rechazar: (error: Error) => void;
}

// El gateway emite los rechazos de moderación como `exception` con status 422,
// sin ack. No son errores de conexión.
function esExcepcionModeracion(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const posible = error as { status?: unknown; message?: unknown };
  if (posible.status === 422) return true;

  if (posible.message && typeof posible.message === "object") {
    const interno = posible.message as { status?: unknown; message?: unknown };
    if (interno.status === 422) return true;
    return (
      typeof interno.message === "string" &&
      /contenido no permitido/i.test(interno.message)
    );
  }

  return (
    typeof posible.message === "string" &&
    /contenido no permitido/i.test(posible.message)
  );
}

// engine.io-client acepta `addTrailingSlash`, pero no está tipado en
// socket.io-client. Sin él, el cliente pide `/api/socket.io/` y Next responde
// 308 (normalización de barra final), que engine.io no sigue.
interface OpcionesChatSocket extends Partial<ManagerOptions & SocketOptions> {
  addTrailingSlash?: boolean;
}

const opcionesSocketChat = (): OpcionesChatSocket => ({
  path: RUTA_SOCKET_CHAT,
  addTrailingSlash: false,
  // El proxy de Next (rewrites) no reenvía los frames del upgrade a WebSocket;
  // con polling la entrega sigue siendo en tiempo real vía long-polling.
  transports: ["polling"],
  withCredentials: true,
});

// Canal tiempo real del namespace /chat. Une a la room, expone vivos y envío.
// El payload WS no incluye flags de lectura: el componente lo normaliza y da
// prioridad al historial REST en los duplicados.
// El reset por conversacionId se hace por remontaje (key) en el componente.
export function useChatTiempoReal(conversacionId: string | null) {
  const [conectado, setConectado] = useState(false);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const [mensajesEnVivo, setMensajesEnVivo] = useState<MensajeWsDTO[]>([]);
  const [enviando, setEnviando] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const envioPendienteRef = useRef<EnvioPendiente | null>(null);

  useEffect(() => {
    if (!conversacionId || !esObjectIdValido(conversacionId)) return;

    setSesionExpirada(false);

    const socket: Socket = io(NAMESPACE_CHAT, opcionesSocketChat());
    socketRef.current = socket;

    const agregarSinDuplicar = (mensajes: MensajeWsDTO[]) => {
      if (mensajes.length === 0) return;
      setMensajesEnVivo((previos) => {
        const vistos = new Set(previos.map((m) => m.id));
        const nuevos = mensajes.filter((m) => !vistos.has(m.id));
        if (nuevos.length === 0) return previos;
        return [...previos, ...nuevos];
      });
    };

    const unirse = async () => {
      try {
        const sync = await socket.timeout(10_000).emitWithAck(
          "chat:join_conversacion",
          { conversacionId, limit: LIMITE_MENSAJES_WEB },
        );
        const respuesta = sync as SincronizacionChat;
        if (Array.isArray(respuesta?.items)) {
          agregarSinDuplicar(respuesta.items);
        }
      } catch (error) {
        setErrorConexion((previo) => previo ?? extraerMensajeErrorWs(error));
      }
    };

    const alConectar = () => {
      setConectado(true);
      setErrorConexion(null);
      void unirse();
    };

    const alDesconectar = (motivo: string) => {
      setConectado(false);
      // El back solo desconecta al cliente cuando rechaza la sesión.
      if (motivo === "io server disconnect") {
        setSesionExpirada(true);
        setErrorConexion(MENSAJE_SESION_EXPIRADA);
      }
    };

    const alErrorConexion = (error: unknown) => {
      setConectado(false);
      setErrorConexion(
        error instanceof Error && error.message
          ? error.message
          : "No pudimos conectar al chat. Reintenta.",
      );
    };

    const alMensajeNuevo = (mensaje: MensajeWsDTO) => {
      if (mensaje?.conversacionId !== conversacionId) return;
      agregarSinDuplicar([mensaje]);
    };

    const alExcepcion = (error: unknown) => {
      if (esExcepcionModeracion(error)) {
        const pendiente = envioPendienteRef.current;
        if (pendiente) {
          envioPendienteRef.current = null;
          pendiente.rechazar(
            new ErrorContenidoNoPermitido(MENSAJE_CONTENIDO_NO_PERMITIDO),
          );
        }
        return;
      }

      setErrorConexion(extraerMensajeErrorWs(error));
    };

    socket.on("connect", alConectar);
    socket.on("disconnect", alDesconectar);
    socket.on("connect_error", alErrorConexion);
    socket.on("chat:mensaje_nuevo", alMensajeNuevo);
    socket.on("exception", alExcepcion);

    return () => {
      socket.off("connect", alConectar);
      socket.off("disconnect", alDesconectar);
      socket.off("connect_error", alErrorConexion);
      socket.off("chat:mensaje_nuevo", alMensajeNuevo);
      socket.off("exception", alExcepcion);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversacionId]);

  const enviar = useCallback(
    async (texto: string): Promise<MensajeWsDTO> => {
      const socket = socketRef.current;
      if (!socket || !conversacionId) {
        throw new Error("Chat no conectado. Reintenta.");
      }
      const recortado = texto.trim();
      if (!recortado) {
        throw new Error("El mensaje no puede estar vacío");
      }
      if (recortado.length > 2000) {
        throw new Error("El mensaje no puede superar los 2000 caracteres");
      }
      setEnviando(true);
      const envio = new Promise<never>((_, rechazar) => {
        envioPendienteRef.current = { rechazar };
      });

      try {
        const ack = (await Promise.race([
          socket.timeout(10_000).emitWithAck("chat:enviar_mensaje", {
            conversacionId,
            texto: recortado,
          }),
          envio,
        ])) as MensajeWsDTO;
        setMensajesEnVivo((previos) => {
          if (previos.some((m) => m.id === ack.id)) return previos;
          return [...previos, ack];
        });
        return ack;
      } catch (error) {
        if (error instanceof ErrorContenidoNoPermitido) throw error;
        throw new Error(extraerMensajeErrorWs(error));
      } finally {
        envioPendienteRef.current = null;
        setEnviando(false);
      }
    },
    [conversacionId],
  );

  const reintentarConexion = useCallback(() => {
    setErrorConexion(null);
    socketRef.current?.connect();
  }, []);

  return {
    conectado,
    errorConexion,
    sesionExpirada,
    mensajesEnVivo,
    enviando,
    enviar,
    reintentarConexion,
  };
}
