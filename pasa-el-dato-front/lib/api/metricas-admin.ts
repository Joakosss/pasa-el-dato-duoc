import type {
  DashboardMetricasRespuestaDTO,
  MetricasDashboardQueryDTO,
} from "@/domain/dtos/metricas-admin.dto";
import { apiClient } from "./index";

// GET /admin/metricas/dashboard?desde&hasta&sedeId (cookie accessToken).
// Requiere rol Administrador. Responde 200 con hayDatos=false cuando no hay
// datos; 400 rango invalido/>365 dias; 404 sede inexistente.
export async function obtenerMetricasDashboardApi(
  query: MetricasDashboardQueryDTO,
): Promise<DashboardMetricasRespuestaDTO> {
  return apiClient.get<DashboardMetricasRespuestaDTO>(
    "/admin/metricas/dashboard",
    {
      query: {
        desde: query.desde,
        hasta: query.hasta,
        sedeId: query.sedeId,
      },
    },
  );
}
