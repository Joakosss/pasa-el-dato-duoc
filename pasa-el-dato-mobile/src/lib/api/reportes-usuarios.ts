import { apiClient } from './index';

export interface CrearReporteUsuarioRequest {
  descripcion: string;
}

export interface ReporteUsuarioCreado {
  id: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'DESCARTADO';
  createdAt: string;
}

export function crearReporteUsuario(
  usuarioId: string,
  datos: CrearReporteUsuarioRequest,
  accessToken: string,
): Promise<ReporteUsuarioCreado> {
  return apiClient.post<ReporteUsuarioCreado>(
    `/usuarios/${encodeURIComponent(usuarioId)}/reportes`,
    datos,
    { accessToken },
  );
}
