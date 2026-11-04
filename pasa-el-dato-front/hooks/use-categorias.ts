"use client";

import { useQuery } from "@tanstack/react-query";
import { listarCategorias } from "@/lib/api/categorias";

// Catálogo de categorías para selects de publicaciones.
export function useCategorias() {
  const query = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    categorias: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError
      ? "No pudimos cargar las categorías. Reintenta."
      : null,
    reintentar: query.refetch,
  };
}
