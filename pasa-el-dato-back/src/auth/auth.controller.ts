import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService, type UsuarioAutenticado } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { AuthLogInterceptor } from './auth-log.interceptor.js';
import { JwtAuthGuard, type SesionAutenticada } from './jwt-auth.guard.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuthLogInterceptor)
  async login(
    @Body() datos: IniciarSesionDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<UsuarioAutenticado> {
    const { usuario, accessToken, refreshToken } =
      await this.authService.iniciarSesion(datos);

    this.establecerCookies(respuesta, accessToken, refreshToken);
    respuesta.locals.authCuentaId = usuario.idCuenta;
    return usuario;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuthLogInterceptor)
  @ApiOperation({
    summary: 'Renovar la sesión',
    description:
      'No recibe un cuerpo. Usa la cookie HttpOnly refreshToken obtenida al iniciar sesión y la reemplaza junto con accessToken.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({
    description: 'Sesión renovada. Los nuevos tokens se envían en cookies HttpOnly; el cuerpo está vacío.',
  })
  @ApiUnauthorizedResponse({
    description: 'Falta el refresh token o es inválido, expiró o ya fue usado.',
  })
  @ApiForbiddenResponse({
    description: 'La cuenta está bloqueada o inactiva.',
  })
  async refresh(
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    // cookie-parser, configurado en main.ts, entrega las cookies aquí.
    const token = solicitud.cookies?.refreshToken;
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const { idCuenta, accessToken, refreshToken } =
      await this.authService.renovarSesion(token);
    this.establecerCookies(respuesta, accessToken, refreshToken);
    respuesta.locals.authCuentaId = idCuenta;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuthLogInterceptor)
  @ApiOperation({
    summary: 'Cerrar la sesión vigente',
    description:
      'No recibe un cuerpo. Revoca solo la sesión actual desde las cookies HttpOnly accessToken y refreshToken, limpia ambas cookies y siempre responde 200 con cuerpo vacío.',
  })
  @ApiCookieAuth('accessToken')
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({
    description: 'Sesión cerrada. Ambas cookies quedan limpias; el cuerpo está vacío.',
  })
  async logout(
    @Req() solicitud: Request,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const accessToken = solicitud.cookies?.accessToken;
    const refreshToken = solicitud.cookies?.refreshToken;

    // Decodifica sin verificar: logout es idempotente y funciona
    // incluso con firma inválida o sesión expirada.
    let accessJti: string | undefined;
    let accessSub: string | undefined;
    let accessExp: number | undefined;
    if (typeof accessToken === 'string' && accessToken) {
      try {
        const decodificado = this.jwtService.decode(accessToken) as
          | { jti?: unknown; sub?: unknown; exp?: unknown }
          | null;
        if (decodificado) {
          if (
            typeof decodificado.jti === 'string' &&
            decodificado.jti
          ) {
            accessJti = decodificado.jti;
          }
          if (
            typeof decodificado.sub === 'string' &&
            decodificado.sub
          ) {
            accessSub = decodificado.sub;
          }
          if (
            typeof decodificado.exp === 'number' &&
            Number.isFinite(decodificado.exp)
          ) {
            accessExp = decodificado.exp;
          }
        }
      } catch {
        // Sin sesión válida igual se limpian cookies y se responde 200.
      }
    }

    await this.authService.cerrarSesion({
      accessJti,
      accessSub,
      accessExp,
      refreshToken:
        typeof refreshToken === 'string' && refreshToken
          ? refreshToken
          : undefined,
    });
    if (accessSub) {
      respuesta.locals.authCuentaId = accessSub;
    }
    this.limpiarCookies(respuesta);
  }

  @Get('sesion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AuthLogInterceptor)
  @ApiOperation({
    summary: 'Consultar el rol de la sesión vigente',
    description:
      'No recibe cuerpo ni parámetros. Deriva el rol desde la cookie HttpOnly accessToken y la cuenta en PostgreSQL.',
  })
  @ApiCookieAuth('accessToken')
  @ApiOkResponse({
    description: 'Sesión vigente. Devuelve el único rol activo con su descripción.',
  })
  @ApiUnauthorizedResponse({
    description: 'Sin sesión, sesión vencida o sesión inválida.',
  })
  sesion(
    @Req() solicitud: Request & { user?: SesionAutenticada },
  ): { rol: { id: number; descripcion: string } } {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return {
      rol: { id: user.rol.id, descripcion: user.rol.descripcion },
    };
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

  private establecerCookies(
    respuesta: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const opcionesComunes = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    respuesta.cookie('accessToken', accessToken, {
      ...opcionesComunes,
      path: '/api',
      maxAge: Number(process.env.JWT_ACCESS_TTL_SECONDS) * 1000,
    });

    respuesta.cookie('refreshToken', refreshToken, {
      ...opcionesComunes,
      path: '/api/auth',
      // REFRESH_TOKEN_TTL_DAYS se expresa en días; maxAge usa milisegundos.
      maxAge:
        Number(process.env.REFRESH_TOKEN_TTL_DAYS) *
        24 * 60 * 60 * 1000,
    });
  }
}
