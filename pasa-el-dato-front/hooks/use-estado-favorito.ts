"use client";

import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { obtenerEstadoFavoritoApi } from "@/lib/api/favoritos";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";

// UUID v4 (ParseUUIDPipe del back). Si es inválido no se consulta (E4 spec).
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function esUuidFavoritoValido(publicacionId: string): boolean {
  return UUID_V4_REGEX.test(publicacionId);
}

// Estado de favorito de la cuenta autenticada para una publicación.
// Fuente de verdad: back (persiste tras recarga). Sin sesión válida no
// consulta: el botón muestra no guardado y pide login al accionar.
export function useEstadoFavorito(publicacionId: string) {
  const sesion = useSesionStore(selectSesion);
  const hidratado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const haySesion = Boolean(sesion?.idCuenta);
  const habilitado =
    hidratado && haySesion && esUuidFavoritoValido(publicacionId);

  const query = useQuery({
    queryKey: ["favoritos", "estado", publicacionId],
    queryFn: () => obtenerEstadoFavoritoApi(publicacionId),
    enabled: habilitado,
    staleTime: 30_000,
    // 400 UUID / 401 sin sesión / 404 estado no consultable no reintentan.
    retry: (intentos, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 401 || error.status === 404)
      ) {
        return false;
      }
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  return {
    esFavorito: query.data?.esFavorito ?? false,
    isCargando: habilitado && (query.isPending || query.isFetching),
    error: query.error instanceof ApiError ? query.error : null,
    reintentar: query.refetch,
    habilitado,
  };
}
