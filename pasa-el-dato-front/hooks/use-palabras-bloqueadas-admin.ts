"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  crearPalabraBloqueadaApi,
  eliminarPalabraBloqueadaApi,
  listarPalabrasBloqueadasApi,
} from "@/lib/api/palabras-bloqueadas-admin";

// Clave base: alta/baja la invalidan para refrescar la lista global.
export const CLAVE_PALABRAS_BLOQUEADAS = ["admin-palabras-bloqueadas"] as const;

function mensajeErrorListado(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (error.status === 403)
      return "Tu sesión no tiene permisos para ver las palabras bloqueadas.";
  }
  return "No pudimos cargar las palabras bloqueadas. Reintenta.";
}

// HU-ADM-05-FE01/FE04: lista global vigente.
export function usePalabrasBloqueadas() {
  const query = useQuery({
    queryKey: CLAVE_PALABRAS_BLOQUEADAS,
    queryFn: listarPalabrasBloqueadasApi,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });

  return {
    palabras: query.data ?? [],
    isCargando: query.isPending,
    error: query.isError ? mensajeErrorListado(query.error) : null,
    reintentar: () => query.refetch(),
  };
}

// HU-ADM-05-FE02/FE04: alta con refresco.
export function useCrearPalabraBloqueada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearPalabraBloqueadaApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_PALABRAS_BLOQUEADAS,
      });
    },
  });
}

// HU-ADM-05-FE03/FE04: baja con refresco.
export function useEliminarPalabraBloqueada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: eliminarPalabraBloqueadaApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_PALABRAS_BLOQUEADAS,
      });
    },
  });
}
