"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  advertirReporteUsuarioApi,
  bloquearReporteUsuarioApi,
  descartarReporteUsuarioApi,
  listarReportesUsuariosPendientesApi,
  obtenerReporteUsuarioApi,
  reabrirReporteUsuarioApi,
  tomarReporteUsuarioApi,
} from "@/lib/api/reportes-admin-usuarios";

// Clave base: cualquier resolución la invalida para refrescar lista+detalle.
export const CLAVE_REPORTES_USUARIOS = ["admin-reportes-usuarios"] as const;

function mensajeErrorListado(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (error.status === 403)
      return "Tu sesión no tiene permisos para ver los reportes.";
  }
  return "No pudimos cargar los reportes. Reintenta.";
}

function sinReintentoAuth(failureCount: number, error: unknown): boolean {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403)
  ) {
    return false;
  }
  return failureCount < 1;
}

// HU-ADM-01-FE01/FE06: listado pendientes (contrato: solo PENDIENTE).
export function useReportesUsuariosPendientes() {
  const query = useQuery({
    queryKey: [...CLAVE_REPORTES_USUARIOS, "pendientes"],
    queryFn: listarReportesUsuariosPendientesApi,
    retry: sinReintentoAuth,
    refetchOnWindowFocus: false,
  });

  return {
    reportes: query.data ?? [],
    isCargando: query.isPending,
    error: query.isError ? mensajeErrorListado(query.error) : null,
    reintentar: () => query.refetch(),
  };
}

// HU-ADM-01-FE02: detalle + historial disponible en el contrato.
export function useReporteUsuarioDetalle(id: string) {
  const query = useQuery({
    queryKey: [...CLAVE_REPORTES_USUARIOS, id],
    queryFn: () => obtenerReporteUsuarioApi(id),
    retry: sinReintentoAuth,
    refetchOnWindowFocus: false,
    enabled: id.trim().length > 0,
  });

  return {
    reporte: query.data ?? null,
    isCargando: query.isPending,
    error: query.isError ? mensajeErrorListado(query.error) : null,
    reintentar: () => query.refetch(),
  };
}

function useMutacionReporteUsuario(
  fn: (id: string) => Promise<void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_REPORTES_USUARIOS,
      });
    },
  });
}

export function useTomarReporteUsuario() {
  return useMutacionReporteUsuario(tomarReporteUsuarioApi);
}

export function useDescartarReporteUsuario() {
  return useMutacionReporteUsuario(descartarReporteUsuarioApi);
}

export function useReabrirReporteUsuario() {
  return useMutacionReporteUsuario(reabrirReporteUsuarioApi);
}

export function useBloquearReporteUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entrada: { id: string; motivo: string }) =>
      bloquearReporteUsuarioApi(entrada.id, { motivo: entrada.motivo }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_REPORTES_USUARIOS,
      });
    },
  });
}

export function useAdvertirReporteUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entrada: { id: string; mensaje: string }) =>
      advertirReporteUsuarioApi(entrada.id, { mensaje: entrada.mensaje }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_REPORTES_USUARIOS,
      });
    },
  });
}
