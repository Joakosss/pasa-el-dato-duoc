"use client";

import { useCallback, useState } from "react";
import {
  BORRADOR_PUBLICACION_INICIAL_MOMENTANEO,
  type BorradorPublicacionMomentaneo,
} from "@/lib/publicar/tiposMomentaneo";

// TODO[MOMENTANEO]: borrador local sin contrato back. Reemplazar por mutación POST /publicaciones cuando exista.
export function useBorradorPublicacionMomentaneo(
  inicial: BorradorPublicacionMomentaneo = BORRADOR_PUBLICACION_INICIAL_MOMENTANEO,
) {
  const [borrador, setBorrador] =
    useState<BorradorPublicacionMomentaneo>(inicial);

  const actualizar = useCallback(
    (parcial: Partial<BorradorPublicacionMomentaneo>) => {
      setBorrador((prev) => ({ ...prev, ...parcial }));
    },
    [],
  );

  return { borrador, actualizar };
}
