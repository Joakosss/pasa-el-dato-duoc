import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService, type UsuarioAutenticado } from './auth.service.js';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() datos: IniciarSesionDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<UsuarioAutenticado> {
    const { usuario, accessToken, refreshToken } =
      await this.authService.iniciarSesion(datos);

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

    return usuario;
  }
}
