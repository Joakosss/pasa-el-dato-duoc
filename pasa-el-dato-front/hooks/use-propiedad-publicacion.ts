"use client";

import { useSyncExternalStore } from "react";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { usePublicacionParaEdicion } from "./use-publicacion-para-edicion";

// Indica si la publicación actual pertenece al usuario de la sesión.
// La única fuente de verdad es GET /publicaciones/:id/edicion (200 = propia).
export function usePropiedadPublicacion(id: string) {
  const sesion = useSesionStore(selectSesion);
  const hidratado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { publicacion, isCargando } = usePublicacionParaEdicion(id);
  const haySesion = Boolean(sesion?.idCuenta);

  return {
    esPropia: hidratado && haySesion && publicacion !== null,
    // Evita mostrar el CTA durante la rehidratación o la consulta de propiedad.
    verificando: !hidratado || (haySesion && isCargando),
  };
}
