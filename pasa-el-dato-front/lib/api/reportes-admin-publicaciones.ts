import type {
  AdvertirRequestDTO,
  ReportePublicacionDetalleDTO,
  ReportePublicacionListaDTO,
  RetirarPublicacionRequestDTO,
} from "@/domain/dtos/reporte-admin.dto";
import { apiClient } from "./index";

function ruta(id: string, accion?: string): string {
  const base = `/admin/reportes/publicaciones/${encodeURIComponent(id)}`;
  return accion ? `${base}/${accion}` : base;
}

// HU-ADM-02: listado solo PENDIENTE (contrato vigente), orden desc por fecha.
export async function listarReportesPublicacionesPendientesApi(): Promise<
  ReportePublicacionListaDTO[]
> {
  return apiClient.get<ReportePublicacionListaDTO[]>(
    "/admin/reportes/publicaciones/pendientes",
  );
}

export async function obtenerReportePublicacionApi(
  id: string,
): Promise<ReportePublicacionDetalleDTO> {
  return apiClient.get<ReportePublicacionDetalleDTO>(ruta(id));
}

export async function tomarReportePublicacionApi(id: string): Promise<void> {
  await apiClient.post<void>(ruta(id, "tomar"));
}

export async function descartarReportePublicacionApi(
  id: string,
): Promise<void> {
  await apiClient.post<void>(ruta(id, "descartar"));
}

export async function reabrirReportePublicacionApi(id: string): Promise<void> {
  await apiClient.post<void>(ruta(id, "reabrir"));
}

export async function retirarReportePublicacionApi(
  id: string,
  dto: RetirarPublicacionRequestDTO,
): Promise<void> {
  const motivo = dto.motivo?.trim();
  await apiClient.post<void>(
    ruta(id, "resolver/retirar"),
    motivo ? { motivo } : {},
  );
}

export async function advertirReportePublicacionApi(
  id: string,
  dto: AdvertirRequestDTO,
): Promise<void> {
  await apiClient.post<void>(ruta(id, "resolver/advertir"), {
    mensaje: dto.mensaje.trim(),
  });
}
