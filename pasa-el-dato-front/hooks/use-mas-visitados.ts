"use client";

import { useQuery } from "@tanstack/react-query";
import { listarMasVistas } from "@/lib/api/publicaciones";

// Más visitados público (GET /publicaciones/mas-vistas).
// Mejor esfuerzo: un fallo no debe romper el detalle.
export function useMasVisitados() {
  const query = useQuery({
    queryKey: ["publicaciones", "mas-vistas"],
    queryFn: listarMasVistas,
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    publicaciones: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError
      ? "No pudimos cargar los más visitados. Reintenta."
      : null,
    reintentar: query.refetch,
  };
}
