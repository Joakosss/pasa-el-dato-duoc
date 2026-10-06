import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator.js';
import type { SesionAutenticada } from './jwt-auth.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [contexto.getHandler(), contexto.getClass()],
    );

    // Sin @Roles() la ruta solo exige sesión vigente.
    if (!requeridos || requeridos.length === 0) {
      return true;
    }

    const solicitud = contexto
      .switchToHttp()
      .getRequest<Request & { user?: SesionAutenticada }>();
    const descripcion = solicitud.user?.rol?.descripcion;

    // Compara descripción cargada desde DB por JwtAuthGuard.
    if (
      typeof descripcion !== 'string' ||
      !requeridos.includes(descripcion)
    ) {
      throw new ForbiddenException('Acceso denegado');
    }

    return true;
  }
}
