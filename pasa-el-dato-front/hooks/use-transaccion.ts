"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { obtenerTransaccion } from "@/lib/api/publicaciones";

// HU-COM-01: consulta de la transacción para participantes
// (GET /publicaciones/:id/transaccion). 401/403/404 no reintentan.
export function useTransaccion(
  publicacionId: string,
  opciones?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: ["transaccion", publicacionId],
    queryFn: () => obtenerTransaccion(publicacionId),
    enabled: opciones?.enabled ?? true,
    staleTime: 30_000,
    retry: (intentos, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      )
        return false;
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  const errorApi = query.error instanceof ApiError ? query.error : null;

  return {
    transaccion: query.data ?? null,
    isCargando: query.isPending || query.isFetching,
    errorApi,
    esSesionInvalida: errorApi?.status === 401,
    esProhibido: errorApi?.status === 403,
    esNoEncontrada:
      errorApi !== null &&
      (errorApi.status === 404 || errorApi.status === 400),
    reintentar: query.refetch,
  };
}
