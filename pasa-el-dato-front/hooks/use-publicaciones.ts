"use client";

import { useQuery } from "@tanstack/react-query";
import { listarPublicaciones } from "@/lib/api/publicaciones";

// Listado público de publicaciones no eliminadas (más recientes primero).
export function usePublicaciones() {
  const query = useQuery({
    queryKey: ["publicaciones"],
    queryFn: listarPublicaciones,
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    publicaciones: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError
      ? "No pudimos cargar las publicaciones. Reintenta."
      : null,
    reintentar: query.refetch,
  };
}
