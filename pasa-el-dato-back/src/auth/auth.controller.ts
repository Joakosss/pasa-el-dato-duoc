import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
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
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { AuthLogInterceptor } from './auth-log.interceptor.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
