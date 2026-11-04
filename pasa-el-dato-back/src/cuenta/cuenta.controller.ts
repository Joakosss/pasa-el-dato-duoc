import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { CuentaService } from './cuenta.service.js';
import { DesactivarCuentaDto } from './dto/desactivar-cuenta.dto.js';
import { EliminarCuentaDto } from './dto/eliminar-cuenta.dto.js';

@ApiTags('Cuenta')
@Controller('cuenta')
export class CuentaController {
  constructor(
    private readonly cuentaService: CuentaService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('me/desactivar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Desactivar cuenta propia (MVP)',
    description:
      'Requiere sesión válida. Aplica desactivación lógica reversible (Cuenta.aprobada=false) y revoca sesiones (refresh tokens y access token actual si es posible). Requiere confirmación explícita.',
  })
  @ApiCookieAuth('accessToken')
  @ApiCookieAuth('refreshToken')
  @ApiNoContentResponse({ description: 'Cuenta desactivada (idempotente).' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'Cuenta bloqueada o inactiva.' })
  async desactivarMiCuenta(
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Body() dto: DesactivarCuentaDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const accessToken = solicitud.cookies?.accessToken;
    let accessJti: string | undefined;
    let accessExp: number | undefined;

    if (typeof accessToken === 'string' && accessToken) {
      try {
        const decodificado = this.jwtService.decode(accessToken) as
          | { jti?: unknown; exp?: unknown }
          | null;
        if (decodificado) {
          if (typeof decodificado.jti === 'string' && decodificado.jti) {
            accessJti = decodificado.jti;
          }
          if (
            typeof decodificado.exp === 'number' &&
            Number.isFinite(decodificado.exp)
          ) {
            accessExp = decodificado.exp;
          }
        }
      } catch {
        // si falla decode, igual desactivamos; solo no persistimos jti.
      }
    }

    await this.cuentaService.desactivarCuentaPropia({
      idCuenta: user.idCuenta,
      accessJti,
      accessExp,
    });

    this.limpiarCookies(respuesta);
    respuesta.locals.authCuentaId = user.idCuenta;
  }

  @Post('me/eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Eliminar lógicamente cuenta propia (MVP)',
    description:
      'Requiere sesión válida. Aplica eliminación lógica (Cuenta.eliminado=true) sin borrado físico y revoca sesiones. Requiere confirmación explícita.',
  })
  @ApiCookieAuth('accessToken')
  @ApiCookieAuth('refreshToken')
  @ApiNoContentResponse({ description: 'Cuenta eliminada lógicamente (idempotente).' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'Cuenta bloqueada o inactiva.' })
  async eliminarMiCuenta(
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Body() dto: EliminarCuentaDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const accessToken = solicitud.cookies?.accessToken;
    let accessJti: string | undefined;
    let accessExp: number | undefined;

    if (typeof accessToken === 'string' && accessToken) {
      try {
        const decodificado = this.jwtService.decode(accessToken) as
          | { jti?: unknown; exp?: unknown }
          | null;
        if (decodificado) {
          if (typeof decodificado.jti === 'string' && decodificado.jti) {
            accessJti = decodificado.jti;
          }
          if (
            typeof decodificado.exp === 'number' &&
            Number.isFinite(decodificado.exp)
          ) {
            accessExp = decodificado.exp;
          }
        }
      } catch {
        // si falla decode, igual eliminamos lógico; solo no persistimos jti.
      }
    }

    await this.cuentaService.eliminarCuentaPropia({
      idCuenta: user.idCuenta,
      accessJti,
      accessExp,
    });

    this.limpiarCookies(respuesta);
    respuesta.locals.authCuentaId = user.idCuenta;
  }

  private limpiarCookies(respuesta: Response): void {
    const opcionesComunes = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    respuesta.clearCookie('accessToken', {
      ...opcionesComunes,
      path: '/api',
    });
    respuesta.clearCookie('refreshToken', {
      ...opcionesComunes,
      path: '/api/auth',
    });
  }
}
