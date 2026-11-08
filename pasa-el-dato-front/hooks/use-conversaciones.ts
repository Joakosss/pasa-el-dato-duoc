"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  LIMITE_CONVERSACIONES_WEB,
  listarConversacionesApi,
} from "@/lib/api/chat";

// Listado paginado de conversaciones del usuario (más reciente primero).
// La clave incluye la cuenta para no mezclar listados al cambiar de sesión
// en el mismo navegador. Cursor opaco: fin cuando nextCursor es null.
export function useConversaciones(idCuenta: string | null) {
  const query = useInfiniteQuery({
    queryKey: ["chat", "conversaciones", idCuenta ?? "sin-cuenta"],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      listarConversacionesApi({
        cursor: pageParam ?? undefined,
        limit: LIMITE_CONVERSACIONES_WEB,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (ultima) => ultima.nextCursor,
    // Al entrar a la pantalla (o volver del detalle) se refresca la actividad.
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
    refetchOnWindowFocus: false,
  });

  const conversaciones = useMemo(
    () => query.data?.pages.flatMap((pagina) => pagina.items) ?? [],
    [query.data],
  );

  const errorApi = query.error instanceof ApiError ? query.error : null;
  const errorInicial = query.isError && query.data === undefined;
  const esSesionInvalida = errorApi?.status === 401;

  return {
    conversaciones,
    isCargando: query.isPending,
    isCargandoMas: query.isFetchingNextPage,
    tieneMas: Boolean(query.hasNextPage),
    cargarMas: query.fetchNextPage,
    esSesionInvalida,
    // Error de la primera página: reemplaza la pantalla.
    errorInicial,
    // Error al pedir una página siguiente: conserva lo ya cargado.
    errorPaginaSiguiente: query.isFetchNextPageError,
    reintentarPaginaSiguiente: query.fetchNextPage,
    error:
      errorInicial && !esSesionInvalida
        ? (errorApi?.message ?? "No pudimos cargar tus chats. Reintenta.")
        : null,
    reintentar: query.refetch,
  };
}
