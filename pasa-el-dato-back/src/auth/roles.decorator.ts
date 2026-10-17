import { SetMetadata } from '@nestjs/common';

// Catálogo cerrado exacto. Vendedor/Comprador son comportamientos Estudiante.
export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);
