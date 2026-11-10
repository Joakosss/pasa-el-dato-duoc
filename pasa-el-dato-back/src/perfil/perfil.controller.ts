import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { ListarCalificacionesQueryDto } from './dto/listar-calificaciones-query.dto.js';
import { ListarCalificacionesRespuestaDto } from './dto/listar-calificaciones-respuesta.dto.js';
import { PerfilRespuestaDto } from './dto/perfil-respuesta.dto.js';
import { ReputacionRespuestaDto } from './dto/reputacion-respuesta.dto.js';
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

  @Get(':idCuenta/reputacion')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Consultar el resumen reputacional de un perfil',
    description:
      'Devuelve el promedio y el total de calificaciones recibidas. Solo disponible para usuarios autenticados.',
  })
  @ApiCookieAuth('accessToken')
  @ApiOkResponse({ type: ReputacionRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado' })
  async obtenerReputacion(
    @Param('idCuenta', new ParseUUIDPipe({ version: '4' })) idCuenta: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
  ): Promise<ReputacionRespuestaDto> {
    if (!solicitud.user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return this.perfilService.obtenerReputacion(idCuenta);
  }

  @Get(':idCuenta/calificaciones')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Listar calificaciones recibidas por un perfil',
    description:
      'Devuelve las calificaciones ordenadas desde la más reciente, con paginación por página. Solo disponible para usuarios autenticados.',
  })
  @ApiCookieAuth('accessToken')
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1, example: 1 })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    enum: [10, 20],
    example: 10,
  })
  @ApiOkResponse({ type: ListarCalificacionesRespuestaDto })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado' })
  async listarCalificaciones(
    @Param('idCuenta', new ParseUUIDPipe({ version: '4' })) idCuenta: string,
    @Query() consulta: ListarCalificacionesQueryDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
  ): Promise<ListarCalificacionesRespuestaDto> {
    if (!solicitud.user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return this.perfilService.listarCalificaciones(
      idCuenta,
      consulta.page,
      consulta.pageSize,
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiCookieAuth('accessToken')
  @ApiBody({ type: ActualizarPerfilDto })
  @ApiOkResponse({ type: PerfilRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  async actualizarPerfil(
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Body() dto: ActualizarPerfilDto,
  ): Promise<PerfilRespuestaDto> {
    const user = solicitud.user;

    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return this.perfilService.actualizarPerfil(user.idCuenta, dto);
  }
}
