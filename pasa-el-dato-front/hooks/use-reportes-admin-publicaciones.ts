"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  advertirReportePublicacionApi,
  descartarReportePublicacionApi,
  listarReportesPublicacionesPendientesApi,
  obtenerReportePublicacionApi,
  reabrirReportePublicacionApi,
  retirarReportePublicacionApi,
  tomarReportePublicacionApi,
} from "@/lib/api/reportes-admin-publicaciones";

export const CLAVE_REPORTES_PUBLICACIONES = [
  "admin-reportes-publicaciones",
] as const;

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

export function useReportesPublicacionesPendientes() {
  const query = useQuery({
    queryKey: [...CLAVE_REPORTES_PUBLICACIONES, "pendientes"],
    queryFn: listarReportesPublicacionesPendientesApi,
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

export function useReportePublicacionDetalle(id: string) {
  const query = useQuery({
    queryKey: [...CLAVE_REPORTES_PUBLICACIONES, id],
    queryFn: () => obtenerReportePublicacionApi(id),
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

function useMutacionReportePublicacion(fn: (id: string) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_REPORTES_PUBLICACIONES,
      });
    },
  });
}

export function useTomarReportePublicacion() {
  return useMutacionReportePublicacion(tomarReportePublicacionApi);
}

export function useDescartarReportePublicacion() {
  return useMutacionReportePublicacion(descartarReportePublicacionApi);
}

export function useReabrirReportePublicacion() {
  return useMutacionReportePublicacion(reabrirReportePublicacionApi);
}

export function useRetirarReportePublicacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entrada: { id: string; motivo?: string }) =>
      retirarReportePublicacionApi(entrada.id, { motivo: entrada.motivo }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_REPORTES_PUBLICACIONES,
      });
    },
  });
}

export function useAdvertirReportePublicacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entrada: { id: string; mensaje: string }) =>
      advertirReportePublicacionApi(entrada.id, { mensaje: entrada.mensaje }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: CLAVE_REPORTES_PUBLICACIONES,
      });
    },
  });
}
