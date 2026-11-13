import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { CalificacionesService } from './calificaciones.service.js';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto.js';
import { CrearCalificacionRespuestaDto } from './dto/crear-calificacion-respuesta.dto.js';

@ApiTags('Calificaciones')
@Controller('publicaciones/:id/calificaciones')
export class CalificacionesController {
  constructor(private readonly calificacionesService: CalificacionesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Registrar calificación de una contraparte en una transacción finalizada (publicación Vendida).',
  })
  @ApiCookieAuth('accessToken')
  @ApiCreatedResponse({ type: CrearCalificacionRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiForbiddenResponse({ description: 'No participa en esta transacción' })
  @ApiNotFoundResponse({
    description:
      'Publicación no encontrada o no hay transacción finalizada para calificar',
  })
  @ApiConflictResponse({
    description:
      'Ya existe una calificación en esta dirección o no se cumple una precondición de negocio',
  })
  @ApiUnprocessableEntityResponse({ description: 'DTO inválido' })
  async crear(
    @Param('id') idPublicacion: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Body() dto: CrearCalificacionDto,
  ): Promise<CrearCalificacionRespuestaDto> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const calificacion = await this.calificacionesService.crear({
      publicacionId: idPublicacion,
      sesion: { idCuenta: user.idCuenta },
      dto,
    });

    return {
      id: calificacion.id,
      publicacionId: calificacion.fk_publicacion,
      emisorId: calificacion.fk_emisor,
      receptorId: calificacion.fk_receptor,
      puntaje: calificacion.puntaje,
      comentario: calificacion.comentario ?? undefined,
      createdAt: calificacion.fechaCreacion.toISOString(),
    };
  }
}
