import type {
  CambiarContrasenaRequestDTO,
  IniciarSesionRequestDTO,
  UsuarioAutenticadoDTO,
} from "@/domain/dtos/auth.dto";
import { apiClient } from "./index";

// POST /auth/login { correo, contrasena } -> UsuarioAutenticado (200).
// Los tokens llegan en cookies HttpOnly (las envía/guarda el navegador por
// credentials:"include" global); el cuerpo no contiene tokens.
export async function iniciarSesion(
  payload: IniciarSesionRequestDTO,
): Promise<UsuarioAutenticadoDTO> {
  return apiClient.post<UsuarioAutenticadoDTO>("/auth/login", payload);
}

export async function cerrarSesionApi(): Promise<void> {
  return apiClient.post<void>("/auth/logout");
}

// PATCH /auth/password { contrasenaActual, contrasenaNueva } -> 204 sin cuerpo.
// El back revoca sesiones y limpia cookies; el front debe forzar re-login.
export async function cambiarContrasenaApi(
  payload: CambiarContrasenaRequestDTO,
): Promise<void> {
  return apiClient.patch<void>("/auth/password", payload);
}