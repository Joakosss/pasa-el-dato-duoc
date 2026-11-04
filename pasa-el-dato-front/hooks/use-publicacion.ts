"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { obtenerPublicacion } from "@/lib/api/publicaciones";

// Detalle público de una publicación. Un 400/404 se trata como "no encontrada".
export function usePublicacion(id: string) {
  const query = useQuery({
    queryKey: ["publicacion", id],
    queryFn: () => obtenerPublicacion(id),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: (intentos, error) => {
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
        return false;
      }
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  const esNoEncontrada =
    query.error instanceof ApiError &&
    (query.error.status === 404 || query.error.status === 400);

  return {
    publicacion: query.data ?? null,
    isCargando: query.isPending || query.isFetching,
    esNoEncontrada,
    error:
      query.isError && !esNoEncontrada
        ? "No pudimos cargar la publicación. Reintenta."
        : null,
    reintentar: query.refetch,
  };
}
