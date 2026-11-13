"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { obtenerPublicacionParaEdicion } from "@/lib/api/publicaciones";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";

// Publicación propia para pre-edición. El back responde 404 cuando no es
// propia o está eliminada, y 401 cuando la sesión no es válida.
// A diferencia del detalle público, responde en cualquier estado
// ("En curso", "Pausada", "Vendido").
export function usePublicacionParaEdicion(
  id: string,
  opciones?: { enabled?: boolean },
) {
  const sesion = useSesionStore(selectSesion);
  const idCuenta = sesion?.idCuenta ?? null;

  const query = useQuery({
    queryKey: ["publicacion-edicion", id, idCuenta],
    queryFn: () => obtenerPublicacionParaEdicion(id),
    enabled: Boolean(id && idCuenta) && (opciones?.enabled ?? true),
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const esNoEncontrada =
    query.error instanceof ApiError &&
    (query.error.status === 404 || query.error.status === 403);

  const esSesionInvalida =
    query.error instanceof ApiError && query.error.status === 401;

  return {
    publicacion: query.data ?? null,
    isCargando: Boolean(idCuenta) && query.isPending,
    esNoEncontrada,
    esSesionInvalida,
    consultaActiva: Boolean(id && idCuenta) && (opciones?.enabled ?? true),
    error:
      query.isError && !esNoEncontrada && !esSesionInvalida
        ? "No pudimos cargar la publicación. Reintenta."
        : null,
    reintentar: query.refetch,
  };
}
