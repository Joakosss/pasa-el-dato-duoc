import type {
  CrearReportePublicacionRequestDTO,
  CrearReporteUsuarioRequestDTO,
  MotivoReporteDTO,
  ReportePublicacionCreadoDTO,
  ReporteUsuarioCreadoDTO,
} from "@/domain/dtos/reporte.dto";
import { apiClient } from "./index";

function normalizarComentarios(comentarios?: string): string | undefined {
  if (comentarios === undefined) return undefined;
  return comentarios.trim() === "" ? undefined : comentarios.trim();
}

// HU-REP-01: catálogo público para el selector del formulario.
export async function listarMotivosReporte(): Promise<MotivoReporteDTO[]> {
  return apiClient.get<MotivoReporteDTO[]>("/motivos-reporte");
}

// HU-REP-01: POST /reportes/publicaciones (JSON, cookie accessToken).
export async function crearReportePublicacion(
  dto: CrearReportePublicacionRequestDTO,
): Promise<ReportePublicacionCreadoDTO> {
  const comentarios = normalizarComentarios(dto.comentarios);
  return apiClient.post<ReportePublicacionCreadoDTO>("/reportes/publicaciones", {
    publicacionId: dto.publicacionId,
    motivoId: dto.motivoId,
    ...(comentarios === undefined ? {} : { comentarios }),
  });
}

// HU-REP-02: catálogo público para el selector del formulario.
export async function listarMotivosReporteUsuario(): Promise<MotivoReporteDTO[]> {
  return apiClient.get<MotivoReporteDTO[]>("/motivos-reporte-usuario");
}

// HU-REP-02: POST /reportes/usuarios (JSON, cookie accessToken).
export async function crearReporteUsuario(
  dto: CrearReporteUsuarioRequestDTO,
): Promise<ReporteUsuarioCreadoDTO> {
  const comentarios = normalizarComentarios(dto.comentarios);
  return apiClient.post<ReporteUsuarioCreadoDTO>("/reportes/usuarios", {
    usuarioReportadoId: dto.usuarioReportadoId,
    motivoId: dto.motivoId,
    ...(comentarios === undefined ? {} : { comentarios }),
  });
}
