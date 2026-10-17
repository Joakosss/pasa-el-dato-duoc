import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

// Rol cargado desde PostgreSQL. Fuente de verdad, no del JWT.
export interface SesionAutenticada {
  idCuenta: string;
  rol: {
    id: number;
    descripcion: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const http = contexto.switchToHttp();
    const solicitud = http.getRequest<
      Request & { user?: SesionAutenticada }
    >();
    const respuesta = http.getResponse<Response>();

    // CU001/HU-AUTH-01 entrega la sesión en cookie accessToken.
    const token = solicitud.cookies?.accessToken;
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Sesión inválida');
    }

    let sub: unknown;
    let jti: unknown;
    try {
      const verificado = await this.jwtService.verifyAsync(token);
      sub = verificado?.sub;
      jti = verificado?.jti;
    } catch {
      // Mensaje genérico: no revela si expiró o si firma falla.
      throw new UnauthorizedException('Sesión inválida');
    }

    if (typeof sub !== 'string' || !sub) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Denylist de logout: solo jti revocados. Sin purga aquí.
    if (typeof jti !== 'string' || !jti) {
      throw new UnauthorizedException('Sesión inválida');
    }
    const revocado = await this.prisma.accessTokenRevocado.findUnique({
      where: { jti },
    });
    if (revocado) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // rolId del JWT es solo pista. Verdad = PostgreSQL via Prisma.
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: sub },
      select: {
        aprobada: true,
        bloqueado: true,
        usuario: {
          select: {
            rol_usuario: {
              select: { id: true, descripcion: true },
            },
          },
        },
      },
    });

    if (
      !cuenta ||
      cuenta.bloqueado ||
      !cuenta.aprobada ||
      !cuenta.usuario
    ) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const sesion: SesionAutenticada = {
      idCuenta: sub,
      rol: {
        id: cuenta.usuario.rol_usuario.id,
        descripcion: cuenta.usuario.rol_usuario.descripcion,
      },
    };

    solicitud.user = sesion;
    respuesta.locals.authCuentaId = sub;
    return true;
  }
}
