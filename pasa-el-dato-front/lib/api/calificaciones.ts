import type {
  ActivarCalificacionDTO,
  CalificacionCreadaDTO,
  CrearCalificacionRequestDTO,
} from "@/domain/dtos/calificacion.dto";
import { apiClient } from "./index";

// POST /publicaciones/:id/calificaciones (JSON, cookie accessToken) — HU-CAL-01.
// Registra la calificación del participante autenticado hacia su contraparte.
// El receptor lo deriva el back; 409 si ya calificó en esa dirección.
export async function crearCalificacion(
  id: string,
  dto: CrearCalificacionRequestDTO,
): Promise<CalificacionCreadaDTO> {
  const cuerpo: CrearCalificacionRequestDTO =
    dto.comentario === undefined || dto.comentario.trim() === ""
      ? { puntaje: dto.puntaje }
      : { puntaje: dto.puntaje, comentario: dto.comentario };
  return apiClient.post<CalificacionCreadaDTO>(
    `/publicaciones/${encodeURIComponent(id)}/calificaciones`,
    cuerpo,
  );
}

// POST /publicaciones/:id/activar-calificacion (cookie accessToken) — HU-CAL-03.
// Solo el vendedor dueño; idempotente (repetir devuelve el estado actual).
export async function activarCalificacion(
  id: string,
): Promise<ActivarCalificacionDTO> {
  return apiClient.post<ActivarCalificacionDTO>(
    `/publicaciones/${encodeURIComponent(id)}/activar-calificacion`,
  );
}
