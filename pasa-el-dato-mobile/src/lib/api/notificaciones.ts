import { apiClient } from './index';

export type TipoNotificacionUsuario =
  | 'CHAT_NUEVO_MENSAJE'
  | 'FAVORITA_VENDIDA'
  | 'REPORTE_RESULTADO'
  | 'ADMIN_ADVERTENCIA'
  | 'ADMIN_AVISO';

export interface NotificacionUsuario {
  id: string;
  tipo: TipoNotificacionUsuario;
  mensaje: string;
  leida: boolean;
  dataJson: Record<string, unknown> | null;
  fechaCreacion: string;
}

export interface ListaNotificacionesUsuario {
  items: NotificacionUsuario[];
  nextPage: number | null;
  page: number;
  pageSize: number;
  total: number;
}

export interface PreferenciasNotificaciones {
  pushHabilitado: boolean;
}

export function listarNotificaciones(
  accessToken: string,
  page = 1,
): Promise<ListaNotificacionesUsuario> {
  return apiClient.get<ListaNotificacionesUsuario>('/notificaciones', {
    accessToken,
    query: { page, pageSize: 20 },
  });
}

export function marcarNotificacionComoLeida(
  id: string,
  accessToken: string,
): Promise<NotificacionUsuario> {
  return apiClient.patch<NotificacionUsuario>(
    `/notificaciones/${encodeURIComponent(id)}/leida`,
    undefined,
    { accessToken },
  );
}

export function obtenerPreferenciasNotificaciones(
  accessToken: string,
): Promise<PreferenciasNotificaciones> {
  return apiClient.get<PreferenciasNotificaciones>(
    '/notificaciones/preferencias',
    { accessToken },
  );
}

export function actualizarPreferenciasNotificaciones(
  pushHabilitado: boolean,
  accessToken: string,
): Promise<PreferenciasNotificaciones> {
  return apiClient.patch<PreferenciasNotificaciones>(
    '/notificaciones/preferencias',
    { pushHabilitado },
    { accessToken },
  );
}
