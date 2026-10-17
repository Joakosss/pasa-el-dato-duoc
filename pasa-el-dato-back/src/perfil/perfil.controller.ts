import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { PerfilRespuestaDto } from './dto/perfil-respuesta.dto.js';
import { PerfilService } from './perfil.service.js';

@ApiTags('Perfil')
@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consultar mi perfil' })
  @ApiCookieAuth('accessToken')
  @ApiOkResponse({ type: PerfilRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  // async: el throw se convierte en promesa rechazada (el test unitario
  // y el pipeline HTTP esperan una promesa, no una excepción síncrona).
  async obtenerPerfil(
    @Req() solicitud: Request & { user?: SesionAutenticada },
  ): Promise<PerfilRespuestaDto> {
    const user = solicitud.user;

    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return this.perfilService.obtenerPerfil(user.idCuenta);
  }
}
