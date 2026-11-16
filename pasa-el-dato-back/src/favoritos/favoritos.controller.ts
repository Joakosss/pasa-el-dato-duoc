import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { EstadoFavoritoRespuestaDto } from './dto/estado-favorito-respuesta.dto.js';
import { ListarFavoritosQueryDto } from './dto/listar-favoritos-query.dto.js';
import { ListarFavoritosRespuestaDto } from './dto/listar-favoritos-respuesta.dto.js';
import { FavoritosService } from './favoritos.service.js';

type SolicitudAutenticada = Request & { user?: SesionAutenticada };

@ApiTags('Favoritos')
@Controller('favoritos')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('accessToken')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar mis favoritos',
    description:
      'Devuelve los favoritos activos de la cuenta autenticada. La web solicita pageSize=20 y la aplicación móvil pageSize=10. Las publicaciones no disponibles se incluyen con disponible=false.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, minimum: 1 })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    enum: [10, 20],
    example: 20,
    description: 'Usar 20 para web y 10 para móvil.',
  })
  @ApiOkResponse({ type: ListarFavoritosRespuestaDto })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  async listar(
    @Req() solicitud: SolicitudAutenticada,
    @Query() consulta: ListarFavoritosQueryDto,
  ): Promise<ListarFavoritosRespuestaDto> {
    if (!solicitud.user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return this.favoritosService.listarFavoritos(
      solicitud.user.idCuenta,
      consulta.page,
      consulta.pageSize,
    );
  }

  @Get(':publicacionId')
  @ApiOperation({
    summary: 'Consultar el estado del favorito de una publicación',
    description:
      'Indica si la publicación está guardada como favorita activa por la cuenta autenticada (HU-FAV-01).',
  })
  @ApiOkResponse({ type: EstadoFavoritoRespuestaDto })
  @ApiBadRequestResponse({ description: 'publicacionId no es un UUID válido.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  async obtenerEstado(
    @Param('publicacionId', new ParseUUIDPipe({ version: '4' }))
    publicacionId: string,
    @Req() solicitud: SolicitudAutenticada,
  ): Promise<EstadoFavoritoRespuestaDto> {
    return this.favoritosService.obtenerEstadoFavorito(
      publicacionId,
      solicitud.user!.idCuenta,
    );
  }

  @Post(':publicacionId')
  @ApiOperation({
    summary: 'Marcar una publicación como favorita',
    description:
      'Guarda la publicación como favorita de la cuenta autenticada. Es idempotente: si el favorito estaba dado de baja lógicamente, se reactiva. Permite publicaciones Pausada o Vendida. Rechaza publicaciones propias (400) y no disponibles (404).',
  })
  @ApiCreatedResponse({ type: EstadoFavoritoRespuestaDto, description: 'Favorito activo.' })
  @ApiBadRequestResponse({ description: 'publicacionId no es un UUID válido o es su propia publicación.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiNotFoundResponse({ description: 'Publicación no disponible.' })
  async marcar(
    @Param('publicacionId', new ParseUUIDPipe({ version: '4' }))
    publicacionId: string,
    @Req() solicitud: SolicitudAutenticada,
  ): Promise<EstadoFavoritoRespuestaDto> {
    return this.favoritosService.marcarFavorito(publicacionId, solicitud.user!.idCuenta);
  }

  @Delete(':publicacionId')
  @ApiOperation({
    summary: 'Quitar una publicación de favoritos',
    description:
      'Da de baja lógicamente el favorito de la cuenta autenticada. Es idempotente: quitar un favorito inexistente responde igual, sin error. No afecta la publicación ni los favoritos de otros usuarios.',
  })
  @ApiOkResponse({ type: EstadoFavoritoRespuestaDto })
  @ApiBadRequestResponse({ description: 'publicacionId no es un UUID válido.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  async quitar(
    @Param('publicacionId', new ParseUUIDPipe({ version: '4' }))
    publicacionId: string,
    @Req() solicitud: SolicitudAutenticada,
  ): Promise<EstadoFavoritoRespuestaDto> {
    return this.favoritosService.quitarFavorito(publicacionId, solicitud.user!.idCuenta);
  }
}
