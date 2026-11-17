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
import { CrearReportePublicacionDto } from './dto/crear-reporte-publicacion.dto.js';
import { ReportePublicacionService } from './reporte-publicacion.service.js';

@ApiTags('Reportes de publicación')
@Controller('publicaciones/:id/reportes')
export class ReportePublicacionController {
  constructor(
    private readonly reportePublicacionService: ReportePublicacionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reportar una publicación para revisión administrativa' })
  @ApiCookieAuth('accessToken')
  @ApiCreatedResponse({ description: 'Reporte creado en estado PENDIENTE.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'No puedes reportar tu propia publicación.' })
  @ApiNotFoundResponse({ description: 'Publicación no encontrada.' })
  @ApiUnprocessableEntityResponse({ description: 'Datos del reporte inválidos.' })
  async crear(
    @Param('id', new ParseUUIDPipe()) idPublicacion: string,
    @Body() dto: CrearReportePublicacionDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
  ) {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const reporte = await this.reportePublicacionService.crearReportePublicacion({
      publicacionId: idPublicacion,
      reportanteId: user.idCuenta,
      motivo: dto.motivo,
      comentarios: dto.comentarios,
    });

    return {
      id: reporte.id,
      estado: reporte.estado,
      createdAt: reporte.fechaCreacion.toISOString(),
    };
  }
}
