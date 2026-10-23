import type { PerfilRespuestaDTO } from "@/domain/dtos";
import { apiClient } from "./index";

// GET /perfil/me -> perfil del usuario autenticado.
// La identidad la resuelve el back desde la cookie HttpOnly; nunca por URL.
export async function obtenerMiPerfil(): Promise<PerfilRespuestaDTO> {
  return apiClient.get<PerfilRespuestaDTO>("/perfil/me");
}
