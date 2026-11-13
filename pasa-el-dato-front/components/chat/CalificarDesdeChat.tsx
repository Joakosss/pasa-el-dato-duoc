"use client";

import { CalificarEnChat } from "./CalificarEnChat";
import { useConversacionPorId } from "@/hooks/use-conversacion-por-id";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";

// HU-CAL-01 desde el chat: calificación inline en el mismo panel
// (estrellas + comentario + enviar), sin botón ni modal aparte.
// El detalle vendido (GET /:id) solo sirve "En curso" y /edicion solo al
// dueño, así que el chat es la vía canónica para que el comprador califique.
export function CalificarDesdeChat({
  conversacionId,
}: {
  conversacionId: string;
}) {
  const sesion = useSesionStore(selectSesion);
  const idCuentaActual = sesion?.idCuenta ?? null;
  const { conversacion } = useConversacionPorId(conversacionId, idCuentaActual);

  const publicacionId = conversacion?.publicacion.id ?? null;
  if (!publicacionId) return null;

  return <CalificarEnChat publicacionId={publicacionId} />;
}
