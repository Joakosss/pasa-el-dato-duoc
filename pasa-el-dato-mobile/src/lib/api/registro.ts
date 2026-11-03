import { apiClient } from './index';

interface ValidarCorreoRequest {
  correo: string;
}

interface ValidarRunRequest {
  run: string;
}

export interface RegistrarUsuarioRequest {
  run: string;
  correo: string;
  pNombre: string;
  sNombre?: string;
  pApellido: string;
  sApellido: string;
  telefono: string;
  sedeId: number;
  carreraId: number;
  contrasena: string;
}

export function validarCorreoDisponible(payload: ValidarCorreoRequest): Promise<boolean> {
  return apiClient.post<boolean>('/usuario/validar-correo', payload);
}

export function validarRunDisponible(payload: ValidarRunRequest): Promise<boolean> {
  return apiClient.post<boolean>('/usuario/validar-run', payload);
}

export function registrarUsuario(payload: RegistrarUsuarioRequest): Promise<void> {
  return apiClient.post<void>('/usuario/registro', payload);
}
