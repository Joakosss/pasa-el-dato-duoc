import type { IniciarSesionRequestDTO, LoginResponseDTO } from "@/domain/dtos/auth.dto";
import { apiClient } from "./index";

export interface CambiarContrasenaRequest {
  contrasenaActual: string;
  contrasenaNueva: string;
}

export async function iniciarSesion(
  payload: IniciarSesionRequestDTO,
): Promise<LoginResponseDTO> {
  return apiClient.post<LoginResponseDTO>("/auth/login", payload);
}

export function cambiarContrasena(
  payload: CambiarContrasenaRequest,
  accessToken: string,
): Promise<void> {
  return apiClient.patch<void>('/auth/password', payload, { accessToken });
}
