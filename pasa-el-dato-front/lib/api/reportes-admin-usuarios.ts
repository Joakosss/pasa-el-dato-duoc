import type {
  AdvertirRequestDTO,
  BloquearUsuarioRequestDTO,
  ReporteUsuarioDetalleDTO,
  ReporteUsuarioListaDTO,
} from "@/domain/dtos/reporte-admin.dto";
import { apiClient } from "./index";

function ruta(id: string, accion?: string): string {
  const base = `/admin/reportes/usuarios/${encodeURIComponent(id)}`;
  return accion ? `${base}/${accion}` : base;
}

// HU-ADM-01: listado solo PENDIENTE (contrato vigente), orden desc por fecha.
export async function listarReportesUsuariosPendientesApi(): Promise<
  ReporteUsuarioListaDTO[]
> {
  return apiClient.get<ReporteUsuarioListaDTO[]>(
    "/admin/reportes/usuarios/pendientes",
  );
}

export async function obtenerReporteUsuarioApi(
  id: string,
): Promise<ReporteUsuarioDetalleDTO> {
  return apiClient.get<ReporteUsuarioDetalleDTO>(ruta(id));
}

export async function tomarReporteUsuarioApi(id: string): Promise<void> {
  await apiClient.post<void>(ruta(id, "tomar"));
}

export async function descartarReporteUsuarioApi(id: string): Promise<void> {
  await apiClient.post<void>(ruta(id, "descartar"));
}

export async function reabrirReporteUsuarioApi(id: string): Promise<void> {
  await apiClient.post<void>(ruta(id, "reabrir"));
}

export async function bloquearReporteUsuarioApi(
  id: string,
  dto: BloquearUsuarioRequestDTO,
): Promise<void> {
  await apiClient.post<void>(ruta(id, "resolver/bloquear"), {
    motivo: dto.motivo.trim(),
  });
}

export async function advertirReporteUsuarioApi(
  id: string,
  dto: AdvertirRequestDTO,
): Promise<void> {
  await apiClient.post<void>(ruta(id, "resolver/advertir"), {
    mensaje: dto.mensaje.trim(),
  });
}
