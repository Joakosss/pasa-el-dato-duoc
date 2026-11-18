"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { listarFavoritosApi } from "@/lib/api/favoritos";

// Favoritos por página en web (pageSize=20, el mínimo admisible para la web
// según el contrato de GET /favoritos).
export const PAGE_SIZE_FAVORITOS = 20;

// Listado paginado de mis favoritos (page/pageSize del back). Fin cuando
// nextPage es null.
export function useFavoritos() {
  const query = useInfiniteQuery({
    queryKey: ["favoritos", "listado", PAGE_SIZE_FAVORITOS],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      listarFavoritosApi({ page: pageParam, pageSize: PAGE_SIZE_FAVORITOS }),
    initialPageParam: 1,
    getNextPageParam: (ultima) => ultima.nextPage,
    // 401 (sesión inválida) y 400 (parámetros) no son reintentables.
    retry: (intentos, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 400)
      ) {
        return false;
      }
      return intentos < 1;
    },
    // T7: conservar página al volver desde el detalle (caché 30s, sin
    // refetch agresivo al remontar ni al reconectar).
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const favoritos = useMemo(
    () => query.data?.pages.flatMap((pagina) => pagina.items) ?? [],
    [query.data],
  );

  const errorApi = query.error instanceof ApiError ? query.error : null;
  const errorInicial = query.isError && query.data === undefined;
  const esSesionInvalida = errorApi?.status === 401;

  return {
    favoritos,
    total: query.data?.pages[0]?.total ?? 0,
    isCargando: query.isPending,
    isCargandoMas: query.isFetchingNextPage,
    tieneMas: Boolean(query.hasNextPage),
    cargarMas: query.fetchNextPage,
    esSesionInvalida,
    errorInicial,
    errorPaginaSiguiente: query.isFetchNextPageError,
    error:
      errorInicial && !esSesionInvalida
        ? (errorApi?.message ?? "No pudimos cargar tus favoritos. Reintenta.")
        : null,
    reintentar: query.refetch,
    reintentarPaginaSiguiente: query.fetchNextPage,
  };
}
