import { env } from '@/config/env';
import { useSesionStore } from '@/stores/sesion-store';
import { almacenamientoSeguro } from '@/lib/storage/secure-storage';
import { crearCoordinadorSesion } from './coordinador-sesion';
import { ErrorConexion, HttpClient } from './http-client';

const clienteAuth = new HttpClient(env.apiUrl);
const CLAVE_RENOVACION = 'pasaeldato.renovacion.v1';

const coordinadorSesion = crearCoordinadorSesion({
  obtener: () => {
    const { sesion, tokens } = useSesionStore.getState();
    return sesion && tokens ? { identidad: sesion, tokens } : null;
  },
  renovar: async (refreshToken) => {
    const resultado = await clienteAuth.post<unknown>('/mobile/auth/refresh', { refreshToken });
    if (
      !resultado || typeof resultado !== 'object' ||
      !('accessToken' in resultado) || typeof resultado.accessToken !== 'string' || !resultado.accessToken ||
      !('refreshToken' in resultado) || typeof resultado.refreshToken !== 'string' || !resultado.refreshToken
    ) {
      throw new ErrorConexion('No se pudo confirmar la renovación de sesión. Inicia sesión nuevamente.');
    }
    return { accessToken: resultado.accessToken, refreshToken: resultado.refreshToken };
  },
  leerMarcador: async () => await almacenamientoSeguro.getItem(CLAVE_RENOVACION),
  guardarMarcador: async (refreshToken) => {
    await almacenamientoSeguro.setItem(CLAVE_RENOVACION, refreshToken);
  },
  borrarMarcador: async () => {
    await almacenamientoSeguro.removeItem(CLAVE_RENOVACION);
  },
  guardar: (tokens) => useSesionStore.getState().renovarTokens(tokens),
  cerrar: () => useSesionStore.getState().cerrarSesion(),
  descartar: (tokens) => clienteAuth.post<void>(
    '/mobile/auth/logout',
    { refreshToken: tokens.refreshToken },
    { accessToken: tokens.accessToken },
  ),
});

export function requiereReautenticacion(): boolean {
  return coordinadorSesion.requiereReautenticacion();
}

export { ErrorRenovacionIncierta } from './coordinador-sesion';

export function cerrarSesionCoordinada(): Promise<void> {
  return coordinadorSesion.cerrarSesion((tokens) =>
    clienteAuth.post<void>(
      '/mobile/auth/logout',
      { refreshToken: tokens.refreshToken },
      { accessToken: tokens.accessToken },
    ),
  );
}

export const apiClient = new HttpClient(env.apiUrl, coordinadorSesion);

export { ApiError, ErrorConexion, HttpClient } from './http-client';
