"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { obtenerReputacion } from "@/lib/api/perfil";

// HU-CAL-02: resumen reputacional (promedio + total). Sin calificaciones el
// back responde {promedio: null, total: 0}, sin error.
export function useReputacion(
  idCuenta: string | null,
  opciones?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: ["reputacion", idCuenta ?? "sin-cuenta"],
    queryFn: () => obtenerReputacion(idCuenta ?? ""),
    enabled: Boolean(idCuenta) && (opciones?.enabled ?? true),
    staleTime: 30_000,
    retry: (intentos, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 404)
      )
        return false;
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  const errorApi = query.error instanceof ApiError ? query.error : null;

  return {
    reputacion: query.data ?? null,
    isCargando: query.isPending || query.isFetching,
    errorApi,
    esSesionInvalida: errorApi?.status === 401,
    esNoEncontrada: errorApi?.status === 404,
    error:
      query.isError && errorApi?.status !== 401 && errorApi?.status !== 404
        ? (errorApi?.message ?? "No pudimos cargar la reputación. Reintenta.")
        : null,
    reintentar: query.refetch,
  };
}
