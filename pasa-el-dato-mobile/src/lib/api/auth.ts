import type { IniciarSesionRequestDTO, LoginResponseDTO } from "@/domain/dtos/auth.dto";
import { apiClient } from "./index";

export interface CambiarContrasenaRequest {
  contrasenaActual: string;
  contrasenaNueva: string;
}

export interface RenovarSesionRespuesta {
  accessToken: string;
  refreshToken: string;
}

export interface SesionRespuesta {
  rol: {
    id: number;
    descripcion: string;
  };
}

export async function iniciarSesion(
  payload: IniciarSesionRequestDTO,
): Promise<LoginResponseDTO> {
  return apiClient.post<LoginResponseDTO>('/mobile/auth/login', payload);
}

export function cambiarContrasena(
  payload: CambiarContrasenaRequest,
  accessToken: string,
): Promise<void> {
  return apiClient.patch<void>('/auth/password', payload, { accessToken });
}

export function renovarSesion(
  refreshToken: string,
): Promise<RenovarSesionRespuesta> {
  return apiClient.post<RenovarSesionRespuesta>('/mobile/auth/refresh', {
    refreshToken,
  });
}

export function consultarSesion(accessToken: string): Promise<SesionRespuesta> {
  return apiClient.get<SesionRespuesta>('/auth/sesion', { accessToken });
}

export function cerrarSesionRemota(
  accessToken: string | null,
  refreshToken: string,
): Promise<void> {
  return apiClient.post<void>(
    '/mobile/auth/logout',
    { refreshToken },
    { accessToken },
  );
}
