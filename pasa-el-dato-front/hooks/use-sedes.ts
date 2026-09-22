"use client";

import { useQuery } from "@tanstack/react-query";
import { listarSedes } from "@/lib/api/sedes";

// Catálogo de sedes activas para selects (registro, publicaciones, perfil).
export function useSedes() {
  const query = useQuery({
    queryKey: ["sedes"],
    queryFn: listarSedes,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    sedes: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError ? "No pudimos cargar las sedes. Reintenta." : null,
    reintentar: query.refetch,
  };
}
