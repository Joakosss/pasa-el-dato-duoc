import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AuthService } from '../../auth/auth.service.js';
import { IniciarSesionDto } from '../../auth/dto/iniciar-sesion.dto.js';
import { CerrarSesionMobileDto } from './dto/cerrar-sesion-mobile.dto.js';
import { RenovarSesionMobileDto } from './dto/renovar-sesion-mobile.dto.js';

interface RespuestaLoginMobile {
  idCuenta: string;
  correo: string;
  usuario: {
    run: string;
    pNombre: string;
    sNombre: string | null;
    pApellido: string;
    sApellido: string;
    rol: { id: number; descripcion: string };
  };
  accessToken: string;
  refreshToken: string;
}

interface RespuestaRenovacionMobile {
  accessToken: string;
  refreshToken: string;
}

@Controller('mobile/auth')
export class MobileAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: IniciarSesionDto): Promise<RespuestaLoginMobile> {
    const { usuario, accessToken, refreshToken } =
      await this.authService.iniciarSesion(dto);

    return { ...usuario, accessToken, refreshToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RenovarSesionMobileDto,
  ): Promise<RespuestaRenovacionMobile> {
    const { accessToken, refreshToken } =
      await this.authService.renovarSesion(dto.refreshToken);

    return { accessToken, refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() solicitud: Request,
    @Body() dto: CerrarSesionMobileDto,
  ): Promise<void> {
    const accessToken = this.obtenerBearer(solicitud);

    let accessJti: string | undefined;
    let accessSub: string | undefined;
    let accessExp: number | undefined;

    if (accessToken) {
      const decodificado = this.jwtService.decode(accessToken) as
        | { jti?: unknown; sub?: unknown; exp?: unknown }
        | null;

      if (decodificado) {
        accessJti =
          typeof decodificado.jti === 'string' && decodificado.jti
            ? decodificado.jti
            : undefined;
        accessSub =
          typeof decodificado.sub === 'string' && decodificado.sub
            ? decodificado.sub
            : undefined;
        accessExp =
          typeof decodificado.exp === 'number' &&
          Number.isFinite(decodificado.exp)
            ? decodificado.exp
            : undefined;
      }
    }

    await this.authService.cerrarSesion({
      accessJti,
      accessSub,
      accessExp,
      refreshToken: dto.refreshToken,
    });
  }

  private obtenerBearer(solicitud: Request): string | undefined {
    const encabezado = solicitud.headers.authorization;
    if (typeof encabezado !== 'string') {
      return undefined;
    }

    const coincidencia = /^Bearer\s+(\S+)$/i.exec(encabezado.trim());
    if (!coincidencia) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return coincidencia[1];
  }
}
