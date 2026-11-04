"use client";

import { useQuery } from "@tanstack/react-query";
import { listarTipoventas } from "@/lib/api/tipoventas";

// Catálogo de tipos de venta. El tipo de la publicación se resuelve por nombre.
export function useTipoventas() {
  const query = useQuery({
    queryKey: ["tipoventas"],
    queryFn: listarTipoventas,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    tipoventas: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError
      ? "No pudimos cargar los tipos de venta. Reintenta."
      : null,
    reintentar: query.refetch,
  };
}
