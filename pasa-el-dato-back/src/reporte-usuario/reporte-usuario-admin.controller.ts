import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthLogInterceptor } from '../auth/auth-log.interceptor.js';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ResolverAdvertenciaReporteUsuarioDto } from './dto/resolver-advertencia-reporte-usuario.dto.js';
import { ResolverBloqueoReporteUsuarioDto } from './dto/resolver-bloqueo-reporte-usuario.dto.js';
import { ReporteUsuarioService } from './reporte-usuario.service.js';

@ApiTags('Administración de reportes de usuario')
@Controller('admin/reportes/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
@Roles('Administrador')
export class ReporteUsuarioAdminController {
  constructor(private readonly reporteUsuarioService: ReporteUsuarioService) {}

  @Get('pendientes')
  @ApiOperation({ summary: 'Listar reportes de usuario pendientes' })
  @ApiOkResponse({ description: 'Reportes pendientes.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'La sesión no corresponde a un administrador.' })
  async listarPendientes() {
    return this.reporteUsuarioService.listarPendientes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un reporte de usuario' })
  @ApiOkResponse({ description: 'Detalle de reporte.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'La sesión no corresponde a un administrador.' })
  async obtenerDetalle(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reporteUsuarioService.obtenerDetalle(id);
  }

  @Post(':id/tomar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tomar reporte en revisión (pendiente -> en_proceso)' })
  @ApiOkResponse({ description: 'Reporte tomado en revisión.' })
  @ApiConflictResponse({ description: 'El reporte no puede tomarse en revisión.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  async tomarEnRevision(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }
    respuesta.locals.authCuentaId = user.idCuenta;
    await this.reporteUsuarioService.tomarEnRevision(id, user.idCuenta);
  }

  @Post(':id/descartar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Descartar reporte (pendiente/en_proceso -> descartado)' })
  @ApiOkResponse({ description: 'Reporte descartado.' })
  @ApiConflictResponse({ description: 'El reporte ya fue resuelto.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  async descartar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }
    respuesta.locals.authCuentaId = user.idCuenta;
    await this.reporteUsuarioService.descartar(id, user.idCuenta);
  }

  @Post(':id/reabrir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir reporte (resuelto/descartado -> pendiente)' })
  @ApiOkResponse({ description: 'Reporte reabierto.' })
  @ApiConflictResponse({
    description: 'Solo puede reabrirse un reporte resuelto o descartado.',
  })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  async reabrir(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }
    respuesta.locals.authCuentaId = user.idCuenta;
    await this.reporteUsuarioService.reabrir(id);
  }

  @Post(':id/resolver/bloquear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver reporte bloqueando al usuario reportado' })
  @ApiOkResponse({ description: 'Reporte resuelto por bloqueo.' })
  @ApiBadRequestResponse({ description: 'Motivo de bloqueo requerido.' })
  @ApiConflictResponse({ description: 'El reporte ya fue resuelto o cuenta ya bloqueada.' })
  @ApiNotFoundResponse({ description: 'Reporte o usuario reportado no encontrado.' })
  async resolverBloqueo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolverBloqueoReporteUsuarioDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }
    respuesta.locals.authCuentaId = user.idCuenta;
    await this.reporteUsuarioService.resolverBloqueo({
      idReporte: id,
      adminId: user.idCuenta,
      motivo: dto.motivo,
    });
  }

  @Post(':id/resolver/advertir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver reporte registrando una advertencia' })
  @ApiOkResponse({ description: 'Reporte resuelto por advertencia.' })
  @ApiBadRequestResponse({ description: 'Mensaje de advertencia requerido.' })
  @ApiConflictResponse({ description: 'El reporte ya fue resuelto.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  async resolverAdvertencia(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolverAdvertenciaReporteUsuarioDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }
    respuesta.locals.authCuentaId = user.idCuenta;
    await this.reporteUsuarioService.resolverAdvertencia({
      idReporte: id,
      adminId: user.idCuenta,
      mensaje: dto.mensaje,
    });
  }
}
