import type { CuentaId, PublicacionId } from "@/domain/types/common";

// HU-REP-01/02: espejos del back. Tope fijado por el back
// (REPORTE_COMENTARIO_MAX_LEN / REPORTE_USUARIO_COMENTARIO_MAX_LEN).
export const REPORTE_COMENTARIO_MAX_LEN = 1000 as const;

export type EstadoReporteCreado = "PENDIENTE";

// GET /motivos-reporte y GET /motivos-reporte-usuario (públicos).
export interface MotivoReporteDTO {
  id: number;
  nombre: string;
}

// POST /reportes/publicaciones (JSON, cookie accessToken).
export interface CrearReportePublicacionRequestDTO {
  publicacionId: PublicacionId;
  motivoId: number;
  comentarios?: string;
}

// Espejo de ReportePublicacionCreadoDto del back (201).
export interface ReportePublicacionCreadoDTO {
  id: string;
  publicacionId: PublicacionId;
  motivoId: number;
  comentarios: string | null;
  estado: EstadoReporteCreado;
  fechaCreacion: string;
}

// POST /reportes/usuarios (JSON, cookie accessToken).
export interface CrearReporteUsuarioRequestDTO {
  usuarioReportadoId: CuentaId;
  motivoId: number;
  comentarios?: string;
}

// Espejo de ReporteUsuarioCreadoDto del back (201).
export interface ReporteUsuarioCreadoDTO {
  id: string;
  usuarioReportadoId: CuentaId;
  motivoId: number;
  comentarios: string | null;
  estado: EstadoReporteCreado;
  fechaCreacion: string;
}
