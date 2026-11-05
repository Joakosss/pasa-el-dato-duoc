"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  LIMITE_MENSAJES_WEB,
  listarMensajesApi,
} from "@/lib/api/chat";

// Historial paginado REST (desc en back). La UI invierte a asc para mostrar.
// Cursor = id del último recibido; fin cuando nextCursor es null.
export function useHistorialMensajes(conversacionId: string | null) {
  const query = useInfiniteQuery({
    queryKey: ["chat", "mensajes", conversacionId],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      listarMensajesApi(conversacionId ?? "", {
        cursor: pageParam ?? undefined,
        limit: LIMITE_MENSAJES_WEB,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => ultima.nextCursor,
    enabled: Boolean(conversacionId),
    staleTime: 10_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const errorApi =
    query.error instanceof ApiError ? query.error : null;

  return {
    paginas: query.data?.pages ?? [],
    isCargando: query.isPending,
    isCargandoAnteriores: query.isFetchingNextPage,
    tieneAnteriores: Boolean(query.hasNextPage),
    cargarAnteriores: query.fetchNextPage,
    esSesionInvalida: errorApi?.status === 401,
    esProhibido: errorApi?.status === 403,
    esNoEncontrada:
      errorApi?.status === 404 || errorApi?.status === 400,
    error:
      query.isError && !errorApi
        ? "No pudimos cargar los mensajes. Reintenta."
        : null,
    reintentar: query.refetch,
  };
}
