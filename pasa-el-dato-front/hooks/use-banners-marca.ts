"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { listarBannersMarcaApi } from "@/lib/api/banners";
import type { EstadoBannerDTO } from "@/domain/dtos/banner.dto";

// Banners por página del portal de marca (cursor opaco del back).
export const LIMITE_BANNERS_MARCA = 20;

// Listado de los banners de la marca autenticada con filtro de estado
// opcional. Fin de paginación cuando nextCursor es null; cambiar el filtro
// cambia la clave y reinicia la paginación desde cero.
export function useBannersMarca(estado?: EstadoBannerDTO) {
  const query = useInfiniteQuery({
    queryKey: ["banners-marca", estado ?? "TODOS"],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      listarBannersMarcaApi({
        estado,
        limit: LIMITE_BANNERS_MARCA,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => ultima.nextCursor,
    // 401 (sin sesión) y 403 (cuenta sin rol Marca) no son reintentables.
    retry: (intentos, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  const banners = useMemo(
    () => query.data?.pages.flatMap((pagina) => pagina.items) ?? [],
    [query.data],
  );

  const errorApi = query.error instanceof ApiError ? query.error : null;
  const errorInicial = query.isError && query.data === undefined;

  return {
    banners,
    isCargando: query.isPending,
    isCargandoMas: query.isFetchingNextPage,
    tieneMas: Boolean(query.hasNextPage),
    cargarMas: query.fetchNextPage,
    // 401/403: no hay sesión válida ni permisos para este listado.
    esSesionInvalida:
      errorInicial && (errorApi?.status === 401 || errorApi?.status === 403),
    errorInicial,
    errorPaginaSiguiente: query.isFetchNextPageError,
    error:
      errorInicial && errorApi?.status !== 401 && errorApi?.status !== 403
        ? (errorApi?.message ?? "No pudimos cargar tus banners. Reintenta.")
        : null,
    reintentar: query.refetch,
    reintentarPaginaSiguiente: query.fetchNextPage,
  };
}
