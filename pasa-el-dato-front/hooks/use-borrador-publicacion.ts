"use client";

import { useCallback, useState } from "react";
import {
  BORRADOR_PUBLICACION_INICIAL,
  type BorradorPublicacion,
} from "@/lib/publicar/tipos";

export function useBorradorPublicacion(
  inicial: BorradorPublicacion = BORRADOR_PUBLICACION_INICIAL,
) {
  const [borrador, setBorrador] =
    useState<BorradorPublicacion>(inicial);

  const actualizar = useCallback(
    (parcial: Partial<BorradorPublicacion>) => {
      setBorrador((prev) => ({ ...prev, ...parcial }));
    },
    [],
  );

  return { borrador, actualizar };
}
