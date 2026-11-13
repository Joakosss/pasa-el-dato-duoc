"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { listarCalificaciones } from "@/lib/api/perfil";

// HU-CAL-02: calificaciones recibidas, más recientes primero. Paginación
// page/pageSize del back; fin cuando nextPage es null.
export function useCalificacionesRecibidas(
  idCuenta: string | null,
  opciones?: { enabled?: boolean; pageSize?: 10 | 20 },
) {
  const pageSize = opciones?.pageSize ?? 10;
  const query = useInfiniteQuery({
    queryKey: ["calificaciones-recibidas", idCuenta ?? "sin-cuenta", pageSize],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      listarCalificaciones(idCuenta ?? "", { page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (ultima) => ultima.nextPage,
    enabled: Boolean(idCuenta) && (opciones?.enabled ?? true),
    staleTime: 30_000,
    retry: (intentos, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 ||
          error.status === 404 ||
          error.status === 400)
      )
        return false;
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  const calificaciones = useMemo(
    () => query.data?.pages.flatMap((pagina) => pagina.items) ?? [],
    [query.data],
  );

  const total = query.data?.pages[0]?.total ?? 0;
  const errorApi =
    query.error instanceof ApiError ? query.error : null;
  const errorInicial = query.isError && query.data === undefined;

  return {
    calificaciones,
    total,
    isCargando: query.isPending,
    isCargandoMas: query.isFetchingNextPage,
    tieneMas: Boolean(query.hasNextPage),
    cargarMas: query.fetchNextPage,
    esSesionInvalida: errorApi?.status === 401 && errorInicial,
    errorApi,
    errorInicial,
    error:
      errorInicial && errorApi?.status !== 401 && errorApi?.status !== 404
        ? (errorApi?.message ?? "No pudimos cargar las calificaciones. Reintenta.")
        : null,
    errorPaginaSiguiente: query.isFetchNextPageError,
    reintentar: query.refetch,
    reintentarPaginaSiguiente: query.fetchNextPage,
  };
}
