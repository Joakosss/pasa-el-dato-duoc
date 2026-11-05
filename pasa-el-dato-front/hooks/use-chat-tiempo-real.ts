"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import type { MensajeDTO } from "@/domain/dtos/chat.dto";
import { LIMITE_MENSAJES_WEB, obtenerOrigenChatSocket } from "@/lib/api/chat";

interface SincronizacionChat {
  conversacionId: string;
  items: MensajeDTO[];
  nextCursor: string | null;
}

function esObjectIdValido(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

function extraerMensajeErrorWs(error: unknown): string {
  if (error && typeof error === "object") {
    const posible = error as { status?: unknown; message?: unknown };
    if (typeof posible.message === "string" && posible.message.trim()) {
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

// Canal tiempo real del namespace /chat. Une a la room, expone vivos y envío.
// La fusión/dedup contra el historial REST la decide el componente.
// El reset por conversacionId se hace por remontaje (key) en el componente.
export function useChatTiempoReal(conversacionId: string | null) {
  const [conectado, setConectado] = useState(false);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const [mensajesEnVivo, setMensajesEnVivo] = useState<MensajeDTO[]>([]);
  const [enviando, setEnviando] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!conversacionId || !esObjectIdValido(conversacionId)) return;

    const socket: Socket = io(
      `${obtenerOrigenChatSocket(env.apiUrl)}/chat`,
      {
        withCredentials: true,
        transports: ["websocket", "polling"],
      },
    );
    socketRef.current = socket;

    const agregarSinDuplicar = (mensajes: MensajeDTO[]) => {
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

    const alDesconectar = () => {
      setConectado(false);
    };

    const alErrorConexion = (error: unknown) => {
      setConectado(false);
      setErrorConexion(
        error instanceof Error && error.message
          ? error.message
          : "No pudimos conectar al chat. Reintenta.",
      );
    };

    const alMensajeNuevo = (mensaje: MensajeDTO) => {
      if (mensaje?.conversacionId !== conversacionId) return;
      agregarSinDuplicar([mensaje]);
    };

    const alExcepcion = (error: unknown) => {
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
    async (texto: string): Promise<MensajeDTO> => {
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
      try {
        const ack = (await socket.timeout(10_000).emitWithAck(
          "chat:enviar_mensaje",
          {
            conversacionId,
            texto: recortado,
          },
        )) as MensajeDTO;
        setMensajesEnVivo((previos) => {
          if (previos.some((m) => m.id === ack.id)) return previos;
          return [...previos, ack];
        });
        return ack;
      } catch (error) {
        throw new Error(extraerMensajeErrorWs(error));
      } finally {
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
    mensajesEnVivo,
    enviando,
    enviar,
    reintentarConexion,
  };
}
