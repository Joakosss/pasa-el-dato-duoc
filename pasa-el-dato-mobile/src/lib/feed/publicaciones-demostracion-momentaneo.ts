import type { PublicacionDetalle, PublicacionPublica } from '@/lib/api/publicaciones';

// TODO[MOMENTANEO]: este módulo se conserva temporalmente para no romper
// importaciones existentes; no contiene publicaciones de demostración.
export const PUBLICACIONES_DEMOSTRACION_MOMENTANEO: PublicacionPublica[] = [];

export function obtenerPublicacionDemostracionMomentaneo(
  _id: string,
): PublicacionDetalle | undefined {
  return undefined;
}
