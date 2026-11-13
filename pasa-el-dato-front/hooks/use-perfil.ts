"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActualizarPerfilRequestDTO } from "@/domain/dtos";
import { ApiError } from "@/lib/api";
import { actualizarMiPerfil, obtenerMiPerfil } from "@/lib/api/perfil";
import { useSesionStore } from "@/stores/sesion-store";

// Clave única del perfil propio, aislada por cuenta.
export function clavePerfil(idCuenta: string | null) {
  return ["perfil", "me", idCuenta] as const;
}

// Perfil propio: se consulta solo con sesión local y con caché aislada
// por cuenta para no reutilizar datos de una sesión anterior.
export function usePerfil(idCuenta: string | null) {
  const query = useQuery({
    queryKey: clavePerfil(idCuenta),
    queryFn: obtenerMiPerfil,
    enabled: Boolean(idCuenta),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      // La sesión inválida no se reintenta: se limpia y se redirige.
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });

  const esSesionInvalida =
    query.error instanceof ApiError && query.error.status === 401;

  // Hidrata el nombre de la sede en el store de sesión (el login no lo
  // trae). Se sincroniza en cada carga válida, así también refleja cambios
  // de sede tras editar el perfil. Idempotente por igualdad.
  const nombreSede = query.data?.sede?.nombre ?? null;
  const conDatos = query.data !== undefined;
  useEffect(() => {
    if (!conDatos || !idCuenta) return;
    const sedeActual = useSesionStore.getState().sesion?.sedeNombre ?? null;
    if (sedeActual !== nombreSede) {
      useSesionStore.getState().fijarSede(nombreSede);
    }
  }, [conDatos, nombreSede, idCuenta]);

  return {
    perfil: query.data ?? null,
    isCargando: Boolean(idCuenta) && query.isPending,
    error:
      query.isError && !esSesionInvalida
        ? "No pudimos cargar tu perfil. Revisa tu conexión e inténtalo de nuevo."
        : null,
    esSesionInvalida,
    reintentando: query.isFetching,
    reintentar: query.refetch,
  };
}

// Actualiza teléfono/sede y deja la caché del perfil con la respuesta del back.
export function useActualizarPerfil(idCuenta: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ActualizarPerfilRequestDTO) => actualizarMiPerfil(dto),
    onSuccess: (perfilActualizado) => {
      if (!idCuenta) return;
      queryClient.setQueryData(clavePerfil(idCuenta), perfilActualizado);
      queryClient.invalidateQueries({ queryKey: clavePerfil(idCuenta) });
    },
  });
}
