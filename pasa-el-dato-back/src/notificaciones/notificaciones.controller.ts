import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import {
  ListaNotificacionesUsuarioDto,
  NotificacionUsuarioDto,
} from './dto/notificacion-usuario.dto.js';
import {
  ActualizarPreferenciasNotificacionesDto,
  PreferenciasNotificacionesRespuestaDto,
} from './dto/preferencias-notificaciones.dto.js';
import { NotificacionesService } from './notificaciones.service.js';

type SolicitudAutenticada = Request & { user?: SesionAutenticada };

type CrearNotificacionInternaDto = {
  cuentaId: string;
  tipo: NotificacionUsuarioDto['tipo'] | string;
  mensaje: string;
  dataJson?: Record<string, unknown> | null;
};

@ApiTags('Notificaciones')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('accessToken')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mi historial de notificaciones' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 20 })
  @ApiOkResponse({ type: ListaNotificacionesUsuarioDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiForbiddenResponse({ description: 'Cuenta inactiva' })
  async listar(
    @Req() solicitud: SolicitudAutenticada,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ): Promise<ListaNotificacionesUsuarioDto> {
    return this.notificacionesService.listar(
      this.obtenerCuentaId(solicitud),
      page,
      pageSize,
    );
  }

  @Get('preferencias')
  @ApiOperation({
    summary: 'Consultar preferencias de notificaciones',
    description:
      'Devuelve la preferencia vigente del canal push/in-app de la cuenta autenticada.',
  })
  @ApiOkResponse({
    type: PreferenciasNotificacionesRespuestaDto,
    description: 'Preferencia vigente',
  })
  @ApiBadRequestResponse({ description: 'Solicitud inválida' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiForbiddenResponse({ description: 'Cuenta inactiva' })
  async obtenerPreferencias(
    @Req() solicitud: SolicitudAutenticada,
  ): Promise<PreferenciasNotificacionesRespuestaDto> {
    return this.notificacionesService.obtenerPreferencias(
      this.obtenerCuentaId(solicitud),
    );
  }

  @Patch('preferencias')
  @ApiOperation({
    summary: 'Actualizar preferencias de notificaciones',
    description:
      'Actualiza el canal push/in-app para eventos futuros. No modifica ni elimina notificaciones históricas.',
  })
  @ApiBody({
    type: ActualizarPreferenciasNotificacionesDto,
    examples: {
      habilitar: { summary: 'Habilitar push/in-app', value: { pushHabilitado: true } },
      deshabilitar: {
        summary: 'Deshabilitar push/in-app',
        value: { pushHabilitado: false },
      },
    },
  })
  @ApiOkResponse({
    type: PreferenciasNotificacionesRespuestaDto,
    description: 'Preferencia actualizada',
  })
  @ApiBadRequestResponse({
    description: 'El campo pushHabilitado debe ser booleano',
  })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiForbiddenResponse({ description: 'Cuenta inactiva' })
  async actualizarPreferencias(
    @Req() solicitud: SolicitudAutenticada,
    @Body() dto: ActualizarPreferenciasNotificacionesDto,
  ): Promise<PreferenciasNotificacionesRespuestaDto> {
    return this.notificacionesService.actualizarPreferencias(
      this.obtenerCuentaId(solicitud),
      dto.pushHabilitado,
    );
  }

  @Patch(':id/leida')
  @ApiOperation({ summary: 'Marcar una notificación propia como leída' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: NotificacionUsuarioDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiForbiddenResponse({
    description: 'Cuenta inactiva o sin acceso a la notificación',
  })
  @ApiNotFoundResponse({ description: 'Notificación no encontrada' })
  async marcarComoLeida(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<NotificacionUsuarioDto> {
    return this.notificacionesService.marcarComoLeida(
      this.obtenerCuentaId(solicitud),
      id,
    );
  }

  @Post('_internal/crear')
  @ApiOperation({ summary: '[Interno] Crear notificación de usuario' })
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse({ type: NotificacionUsuarioDto, description: 'Notificación creada' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  async crearInterna(
    @Req() solicitud: SolicitudAutenticada,
    @Body() dto: CrearNotificacionInternaDto,
  ): Promise<NotificacionUsuarioDto | null> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const rol = typeof user.rol === 'string' ? user.rol : user.rol?.descripcion;
    if (rol !== 'ADMIN') {
      throw new ForbiddenException('Solo administradores');
    }

    return this.notificacionesService.crearNotificacion({
      cuentaId: dto.cuentaId,
      tipo: dto.tipo as any,
      mensaje: dto.mensaje,
      dataJson: dto.dataJson ?? null,
    });
  }

  private obtenerCuentaId(solicitud: SolicitudAutenticada): string {
    if (!solicitud.user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return solicitud.user.idCuenta;
  }
}
