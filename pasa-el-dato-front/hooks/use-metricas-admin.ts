"use client";

import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { obtenerMetricasDashboardApi } from "@/lib/api/metricas-admin";
import type { MetricasDashboardQueryDTO } from "@/domain/dtos/metricas-admin.dto";

// Clave base del dashboard: incluye filtros aplicados.
export const CLAVE_METRICAS_DASHBOARD = ["admin-metricas-dashboard"] as const;

function mensajeErrorMetricas(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (error.status === 403)
      return "Tu sesión no tiene permisos para ver las métricas.";
    if (error.status === 404) return "La sede indicada no existe.";
    if (error.status === 400)
      return error.message || "El rango de fechas no es válido.";
  }
  return "No pudimos cargar las métricas. Reintenta.";
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

// HU-ADM-04-FE03/FE04: consulta bajo demanda con filtros aplicados.
export function useMetricasDashboard(query: MetricasDashboardQueryDTO) {
  const resultado = useQuery({
    queryKey: [
      ...CLAVE_METRICAS_DASHBOARD,
      query.desde ?? null,
      query.hasta ?? null,
      query.sedeId ?? null,
    ],
    queryFn: () => obtenerMetricasDashboardApi(query),
    retry: sinReintentoAuth,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  return {
    dashboard: resultado.data ?? null,
    isCargando: resultado.isPending,
    error: resultado.isError ? mensajeErrorMetricas(resultado.error) : null,
    reintentar: () => resultado.refetch(),
  };
}
