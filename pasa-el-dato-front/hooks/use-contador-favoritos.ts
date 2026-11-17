"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { listarFavoritosApi } from "@/lib/api/favoritos";

// Contador de favoritos para el perfil: solo necesitamos `total` (page 1).
// Un fallo aquí no debe bloquear el perfil: se expone `total: null` y la UI
// omite el número.
export function useContadorFavoritos() {
  const query = useQuery({
    queryKey: ["favoritos", "contador"],
    queryFn: () => listarFavoritosApi({ page: 1, pageSize: 20 }),
    staleTime: 30_000,
    // 401 no es reintentable.
    retry: (intentos, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  return {
    // null = sin dato disponible (cargando, error o sesión inválida).
    total: query.data?.total ?? null,
    isCargando: query.isPending,
    reintentar: query.refetch,
  };
}
