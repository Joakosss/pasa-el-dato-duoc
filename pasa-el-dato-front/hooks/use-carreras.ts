"use client";

import { useQuery } from "@tanstack/react-query";
import { listarCarreras } from "@/lib/api/carreras";
import type { EscuelaId } from "@/domain/types/common";

// Catálogo de carreras, opcionalmente filtradas por escuela.
// Sin escuelaId lista todas (validación final del wizard);
// con escuelaId filtra en el servidor (select dependiente).
export function useCarreras(escuelaId?: EscuelaId | null) {
  const habilitado =
    escuelaId === undefined || (escuelaId !== null && Number.isInteger(escuelaId));
  const query = useQuery({
    queryKey: ["carreras", escuelaId === undefined ? "todas" : escuelaId ?? "ninguna"],
    queryFn: () => listarCarreras(escuelaId),
    enabled: habilitado,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    carreras: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError ? "No pudimos cargar las carreras. Reintenta." : null,
    reintentar: query.refetch,
  };
}
