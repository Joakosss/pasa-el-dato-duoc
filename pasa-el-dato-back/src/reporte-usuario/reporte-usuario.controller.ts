import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { CrearReporteUsuarioDto } from './dto/crear-reporte-usuario.dto.js';
import { ReporteUsuarioService } from './reporte-usuario.service.js';

@ApiTags('Reportes de usuario')
@Controller('usuarios/:id/reportes')
export class ReporteUsuarioController {
  constructor(private readonly reporteUsuarioService: ReporteUsuarioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reportar un usuario para revisión administrativa' })
  @ApiCookieAuth('accessToken')
  @ApiCreatedResponse({ description: 'Reporte creado en estado PENDIENTE.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'No puedes reportarte a ti mismo.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  @ApiUnprocessableEntityResponse({ description: 'Descripción inválida.' })
  async crear(
    @Param('id', new ParseUUIDPipe()) idReportado: string,
    @Body() dto: CrearReporteUsuarioDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
  ) {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const reporte = await this.reporteUsuarioService.crearReporteUsuario({
      reportadoId: idReportado,
      reportanteId: user.idCuenta,
      descripcion: dto.descripcion,
    });

    return {
      id: reporte.id,
      estado: reporte.estado,
      createdAt: reporte.fechaCreacion.toISOString(),
    };
  }
}
