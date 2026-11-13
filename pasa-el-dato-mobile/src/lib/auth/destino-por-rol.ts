import type { Href } from 'expo-router';

// Redirección post-login por rol para Expo Router.
// Usa rutas existentes: estudiante -> /inicio (tabs), administrador -> /perfil
// (tabs). El tipo Href valida las rutas en compilación (typedRoutes activo).
export type RolSesion = {
  id: number;
  descripcion: string;
};

const DESTINO_POR_ROL: Record<string, Href> = {
  estudiante: '/inicio',
  administrador: '/perfil',
};

export function resolverDestinoPorRol(rol: RolSesion): Href {
  const clave = rol.descripcion?.trim().toLowerCase() ?? '';
  return DESTINO_POR_ROL[clave] ?? '/inicio';
}
