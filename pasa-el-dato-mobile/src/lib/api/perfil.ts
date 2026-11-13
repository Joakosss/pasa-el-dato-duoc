import { apiClient } from './index';

export interface PerfilReferencia {
  nombre: string;
}

export interface PerfilRespuesta {
  run: string;
  pNombre: string;
  sNombre: string | null;
  pApellido: string;
  sApellido: string;
  correo: string;
  telefono: string;
  sede: PerfilReferencia;
  carrera: PerfilReferencia;
  rol: {
    descripcion: string;
  };
}

export interface ActualizarPerfilRequest {
  pNombre?: string;
  sNombre?: string | null;
  pApellido?: string;
  sApellido?: string;
  telefono?: string;
  sedeId?: number;
}

interface PerfilOpciones {
  accessToken: string;
}

export function obtenerPerfil({ accessToken }: PerfilOpciones): Promise<PerfilRespuesta> {
  return apiClient.get<PerfilRespuesta>('/perfil/me', { accessToken });
}

export function actualizarPerfil(
  payload: ActualizarPerfilRequest,
  { accessToken }: PerfilOpciones,
): Promise<PerfilRespuesta> {
  return apiClient.patch<PerfilRespuesta>('/perfil/me', payload, { accessToken });
}
