import type { CuentaId, PublicacionId } from "@/domain/types/common";

// HU-CAL-01/03: espejos del back. Límite de comentario fijado por el back
// (CALIFICACION_COMENTARIO_MAX_LEN).
export const CALIFICACION_COMENTARIO_MAX_LEN = 500 as const;

export const CALIFICACION_PUNTAJE_MIN = 1 as const;
export const CALIFICACION_PUNTAJE_MAX = 5 as const;

// POST /publicaciones/:id/calificaciones (JSON, cookie accessToken).
export interface CrearCalificacionRequestDTO {
  puntaje: number;
  comentario?: string;
}

// Espejo de CrearCalificacionRespuestaDto del back (201).
export interface CalificacionCreadaDTO {
  id: string;
  publicacionId: PublicacionId;
  emisorId: CuentaId;
  receptorId: CuentaId;
  puntaje: number;
  comentario?: string;
  createdAt: string;
}

// Espejo de ActivarCalificacionRespuestaDto del back
// (POST /publicaciones/:id/activar-calificacion).
export interface ActivarCalificacionDTO {
  publicacionId: PublicacionId;
  calificacionActivada: boolean;
  fechaActivacionCalificacion: string | null;
}
