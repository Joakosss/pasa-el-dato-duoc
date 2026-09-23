import { ROUTES } from "@/config";

// Redirección post-login por rol. El criterio es `descripcion` porque
// `rol_usuario.descripcion` es UNIQUE en el back mientras `id` es
// autoincrement y varía por ambiente (el back resuelve Estudiante por
// descripción). El `id` no decide; queda solo como dato informativo.
// TODO(back): confirmar la descripción exacta del rol 2 con acceso a
// dashboard y reemplazar el placeholder "administrador" si difiere.
const DESTINO_POR_ROL: Record<string, string> = {
  estudiante: ROUTES.home,
  administrador: ROUTES.dashboard,
};

interface RolSesion {
  id: number;
  descripcion: string;
}

export function resolverDestinoPorRol(rol: RolSesion): string {
  const clave = rol.descripcion.trim().toLowerCase();
  return DESTINO_POR_ROL[clave] ?? ROUTES.home;
}
