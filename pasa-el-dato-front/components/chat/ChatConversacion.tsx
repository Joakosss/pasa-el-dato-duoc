"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { EnvioMensajeForm } from "./EnvioMensajeForm";
import { CalificarDesdeChat } from "./CalificarDesdeChat";
import { CierreVentaDesdeChat } from "./CierreVentaDesdeChat";
import { EstadoConexionChat } from "./EstadoConexionChat";
import { MensajeBurbuja } from "./MensajeBurbuja";
import { ROUTES } from "@/config/constants";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { useChatTiempoReal } from "@/hooks/use-chat-tiempo-real";
import { useHistorialMensajes } from "@/hooks/use-historial-mensajes";
import { useLecturaConversacion } from "@/hooks/use-lectura-conversacion";
import { estadoLecturaMensaje, normalizarMensajeWs } from "@/lib/chat/mensajes";
import type { MensajeDTO } from "@/domain/dtos/chat.dto";

function esObjectIdValido(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

function ordenarAsc(mensajes: MensajeDTO[]): MensajeDTO[] {
  return [...mensajes].sort((a, b) => {
    const ta = new Date(a.enviadoEn).getTime();
    const tb = new Date(b.enviadoEn).getTime();
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

export function ChatConversacion({ conversacionId }: { conversacionId: string }) {
  const router = useRouter();
  const sesion = useSesionStore(selectSesion);
  const idCuentaActual = sesion?.idCuenta;
  const idValido = esObjectIdValido(conversacionId);
  const listaRef = useRef<HTMLUListElement>(null);

  const historial = useHistorialMensajes(idValido ? conversacionId : null);
  const tiempoReal = useChatTiempoReal(idValido ? conversacionId : null);

  const mensajes = useMemo(() => {
    const baseDesc = historial.paginas.flatMap((p) => p.items);
    const baseAsc = [...baseDesc].reverse();
    const combinados = new Map<string, MensajeDTO>();
    for (const m of baseAsc) combinados.set(m.id, m);
    for (const m of tiempoReal.mensajesEnVivo) {
      // El historial REST trae los flags de lectura; el WS no debe pisarlos.
      if (combinados.has(m.id)) continue;
      combinados.set(m.id, normalizarMensajeWs(m, idCuentaActual));
    }
    return ordenarAsc([...combinados.values()]);
  }, [historial.paginas, tiempoReal.mensajesEnVivo, idCuentaActual]);

  const ultimoMensajeRecibidoId = useMemo(() => {
    for (let i = mensajes.length - 1; i >= 0; i -= 1) {
      if (mensajes[i].emisorCuentaId !== idCuentaActual) {
        return mensajes[i].id;
      }
    }
    return null;
  }, [mensajes, idCuentaActual]);

  const lectura = useLecturaConversacion({
    conversacionId: idValido ? conversacionId : null,
    habilitado:
      idValido &&
      !historial.isCargando &&
      !historial.error &&
      !historial.esSesionInvalida &&
      !historial.esProhibido &&
      !historial.esNoEncontrada &&
      !tiempoReal.sesionExpirada,
    ultimoMensajeRecibidoId,
  });

  const sesionInvalida =
    historial.esSesionInvalida ||
    tiempoReal.sesionExpirada ||
    lectura.esSesionInvalida;

  useEffect(() => {
    if (sesionInvalida) {
      toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
      router.replace(ROUTES.login);
    }
  }, [sesionInvalida, router]);

  useEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes.length]);

  if (!idValido) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-navy">Conversación no encontrada</h1>
        <p className="mt-1 text-sm text-gray-500">
          El enlace no es válido. Vuelve a tus chats.
        </p>
        <Link
          href={ROUTES.chats}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Volver a chats
        </Link>
      </div>
    );
  }

  if (historial.isCargando) {
    return (
      <div aria-hidden="true" className="mx-auto w-full max-w-md space-y-2">
        <div className="h-6 w-32 rounded bg-gray-100" />
        <div className="h-64 rounded-2xl border border-gray-200 bg-card p-4">
          <div className="h-8 w-2/3 rounded bg-gray-100" />
          <div className="ml-auto mt-2 h-8 w-1/2 rounded bg-gray-100" />
          <div className="mt-2 h-8 w-3/5 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (historial.esProhibido) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-navy">No participa en esta conversación</h1>
        <p className="mt-1 text-sm text-gray-500">
          Solo los participantes pueden ver estos mensajes.
        </p>
        <Link
          href={ROUTES.chats}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Volver a chats
        </Link>
      </div>
    );
  }

  if (historial.esNoEncontrada) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-navy">Conversación no encontrada</h1>
        <p className="mt-1 text-sm text-gray-500">
          Puede que se haya eliminado o que el enlace no sea válido.
        </p>
        <Link
          href={ROUTES.chats}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Volver a chats
        </Link>
      </div>
    );
  }

  if (historial.error) {
    return (
      <div
        role="alert"
        className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center"
      >
        <p className="text-sm text-gray-500">{historial.error}</p>
        <button
          type="button"
          onClick={() => void historial.reintentar()}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm">
      <EstadoConexionChat
        conectado={tiempoReal.conectado}
        tieneAnteriores={historial.tieneAnteriores}
        cargandoAnteriores={historial.isCargandoAnteriores}
        onCargarAnteriores={() => void historial.cargarAnteriores()}
      />
      <CierreVentaDesdeChat conversacionId={conversacionId} />
      <CalificarDesdeChat conversacionId={conversacionId} />

      {tiempoReal.errorConexion ? (
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-card px-3 py-2">
          <p role="alert" className="text-xs font-medium text-red-600">
            {tiempoReal.errorConexion}
          </p>
          <button
            type="button"
            onClick={tiempoReal.reintentarConexion}
            className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-navy transition hover:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {mensajes.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <p className="text-sm font-semibold text-navy">Aún no hay mensajes</p>
            <p className="mt-1 text-xs text-gray-500">
              Escribe el primero para coordinar la transacción.
            </p>
          </div>
        </div>
      ) : (
        <ul
          ref={listaRef}
          aria-live="polite"
          aria-label="Mensajes de la conversación"
          className="flex-1 space-y-2 overflow-y-auto p-3"
        >
          {mensajes.map((mensaje) => {
            const esPropio = mensaje.emisorCuentaId === idCuentaActual;
            return (
              <MensajeBurbuja
                key={mensaje.id}
                mensaje={mensaje}
                esPropio={esPropio}
                estadoLectura={estadoLecturaMensaje(
                  mensaje,
                  idCuentaActual,
                  lectura.leidoHastaMensajeId,
                )}
              />
            );
          })}
        </ul>
      )}

      <EnvioMensajeForm
        enviando={tiempoReal.enviando}
        deshabilitado={!tiempoReal.conectado}
        onEnviar={(texto) => tiempoReal.enviar(texto).then(() => undefined)}
      />
    </div>
  );
}
