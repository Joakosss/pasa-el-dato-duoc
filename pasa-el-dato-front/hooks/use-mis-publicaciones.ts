"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { listarMisPublicaciones } from "@/lib/api/publicaciones";

// Listado de publicaciones propias no eliminadas (GET /publicaciones/me).
// La clave comparte prefijo con ["publicaciones"], por lo que las mutaciones
// existentes (editar estado/eliminar) invalidan también esta consulta.
export function useMisPublicaciones(opciones?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: ["publicaciones", "me"],
    queryFn: () => listarMisPublicaciones(),
    enabled: opciones?.enabled ?? true,
    staleTime: 30_000,
    retry: (intentos, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return intentos < 1;
    },
    refetchOnWindowFocus: false,
  });

  const esSesionInvalida =
    query.error instanceof ApiError && query.error.status === 401;

  return {
    publicaciones: query.data ?? [],
    // Permite distinguir "sin datos aún" de "lista vacía ya resuelta".
    tieneDatos: query.data !== undefined,
    isCargando: query.isPending || query.isFetching,
    error:
      query.isError && !esSesionInvalida
        ? "No pudimos cargar tus publicaciones. Revisa tu conexión e inténtalo de nuevo."
        : null,
    esSesionInvalida,
    reintentando: query.isFetching,
    reintentar: query.refetch,
  };
}
