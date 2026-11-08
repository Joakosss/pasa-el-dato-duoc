"use client";

import { useMemo } from "react";
import type { ConversacionListaDTO } from "@/domain/dtos/chat.dto";
import type { RolConversacion } from "@/domain/types/chat";
import { useMisPublicaciones } from "./use-mis-publicaciones";

/**
 * Deriva el rol del usuario en cada conversación comparando la publicación
 * con sus publicaciones propias (GET /publicaciones/me).
 *
 * Reglas:
 * - Publicación propia -> VENDIENDO.
 * - Publicación ajena visible -> COMPRANDO.
 * - Publicación NO_DISPONIBLE, consulta fallida o sin datos -> DESCONOCIDO.
 *
 * La consulta de publicaciones propias es única para toda la pantalla
 * (no se hace una por conversación).
 */
export function useRolesConversaciones(
  conversaciones: ConversacionListaDTO[],
): Map<string, RolConversacion> {
  const { publicaciones, tieneDatos, error, esSesionInvalida } =
    useMisPublicaciones();

  return useMemo(() => {
    const idsPropias = new Set(publicaciones.map((publicacion) => publicacion.id));
    const fuenteDisponible = tieneDatos && !error && !esSesionInvalida;

    const roles = new Map<string, RolConversacion>();
    for (const conversacion of conversaciones) {
      // Una publicación eliminada no aparece en /publicaciones/me, así que no
      // se puede afirmar que la conversación sea una compra.
      if (!fuenteDisponible || conversacion.publicacion.estado === "NO_DISPONIBLE") {
        roles.set(conversacion.conversacionId, "DESCONOCIDO");
        continue;
      }

      roles.set(
        conversacion.conversacionId,
        idsPropias.has(conversacion.publicacion.id) ? "VENDIENDO" : "COMPRANDO",
      );
    }

    return roles;
  }, [conversaciones, publicaciones, tieneDatos, error, esSesionInvalida]);
}
