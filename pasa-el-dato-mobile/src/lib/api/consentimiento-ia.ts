import { apiClient } from './index';

export interface EstadoConsentimientoIa {
  autorizado: boolean;
  disponible: boolean;
  registrado: boolean;
}

function ruta(id: string): string {
  return `/mobile/ia/publicaciones/${encodeURIComponent(id)}/consentimiento`;
}

export function obtenerConsentimientoIa(id: string, accessToken: string): Promise<EstadoConsentimientoIa> {
  return apiClient.get(ruta(id), { accessToken });
}

export function autorizarConsentimientoIa(
  id: string,
  titulo: string,
  descripcion: string,
  accessToken: string,
): Promise<EstadoConsentimientoIa> {
  return apiClient.post(ruta(id), { confirmado: true, titulo, descripcion }, { accessToken });
}

export function retirarConsentimientoIa(id: string, accessToken: string): Promise<EstadoConsentimientoIa> {
  return apiClient.delete(ruta(id), { accessToken });
}
