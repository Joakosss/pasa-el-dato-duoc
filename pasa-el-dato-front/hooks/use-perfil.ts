"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { obtenerMiPerfil } from "@/lib/api/perfil";

// Perfil propio: se consulta solo con sesión local y con caché aislada
// por cuenta para no reutilizar datos de una sesión anterior.
export function usePerfil(idCuenta: string | null) {
  const query = useQuery({
    queryKey: ["perfil", "me", idCuenta],
    queryFn: obtenerMiPerfil,
    enabled: Boolean(idCuenta),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      // La sesión inválida no se reintenta: se limpia y se redirige.
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });

  const esSesionInvalida =
    query.error instanceof ApiError && query.error.status === 401;

  return {
    perfil: query.data ?? null,
    isCargando: Boolean(idCuenta) && query.isPending,
    error:
      query.isError && !esSesionInvalida
        ? "No pudimos cargar tu perfil. Revisa tu conexión e inténtalo de nuevo."
        : null,
    esSesionInvalida,
    reintentando: query.isFetching,
    reintentar: query.refetch,
  };
}
