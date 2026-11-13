import type {
  ActualizarPerfilRequestDTO,
  ListadoCalificacionesDTO,
  ListarCalificacionesQuery,
  PerfilRespuestaDTO,
  ReputacionDTO,
} from "@/domain/dtos";
import { apiClient } from "./index";

// GET /perfil/me -> perfil del usuario autenticado.
// La identidad la resuelve el back desde la cookie HttpOnly; nunca por URL.
export async function obtenerMiPerfil(): Promise<PerfilRespuestaDTO> {
  return apiClient.get<PerfilRespuestaDTO>("/perfil/me");
}

// PATCH /perfil/me -> perfil actualizado. Solo envía campos editables.
export async function actualizarMiPerfil(
  dto: ActualizarPerfilRequestDTO,
): Promise<PerfilRespuestaDTO> {
  return apiClient.patch<PerfilRespuestaDTO>("/perfil/me", dto);
}

// GET /perfil/:idCuenta/reputacion (cookie accessToken) — HU-CAL-02.
// Solo autenticados; sin calificaciones responde {promedio: null, total: 0}.
export async function obtenerReputacion(
  idCuenta: string,
): Promise<ReputacionDTO> {
  return apiClient.get<ReputacionDTO>(
    `/perfil/${encodeURIComponent(idCuenta)}/reputacion`,
  );
}

// GET /perfil/:idCuenta/calificaciones?page=&pageSize= (cookie) — HU-CAL-02.
// page >= 1, pageSize 10|20; orden descendente por fecha.
export async function listarCalificaciones(
  idCuenta: string,
  query: ListarCalificacionesQuery = {},
): Promise<ListadoCalificacionesDTO> {
  return apiClient.get<ListadoCalificacionesDTO>(
    `/perfil/${encodeURIComponent(idCuenta)}/calificaciones`,
    {
      query: {
        page: query.page,
        pageSize: query.pageSize,
      },
    },
  );
}
