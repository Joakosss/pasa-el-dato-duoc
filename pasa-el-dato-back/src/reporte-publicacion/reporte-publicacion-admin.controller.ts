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
import { ResolverAdvertenciaReportePublicacionDto } from './dto/resolver-advertencia-reporte-publicacion.dto.js';
import { RetirarPublicacionReportePublicacionDto } from './dto/retirar-publicacion-reporte-publicacion.dto.js';
import { ReportePublicacionService } from './reporte-publicacion.service.js';

@ApiTags('Administración de reportes de publicación')
@Controller('admin/reportes/publicaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
@Roles('Administrador')
export class ReportePublicacionAdminController {
  constructor(
    private readonly reportePublicacionService: ReportePublicacionService,
  ) {}

  @Get('pendientes')
  @ApiOperation({ summary: 'Listar reportes de publicación pendientes' })
  @ApiOkResponse({ description: 'Reportes pendientes con publicación asociada.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'La sesión no corresponde a un administrador.' })
  listarPendientes() {
    return this.reportePublicacionService.listarPendientes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un reporte de publicación' })
  @ApiOkResponse({ description: 'Detalle del reporte y publicación asociada.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  obtenerDetalle(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.reportePublicacionService.obtenerDetalle(id);
  }

  @Post(':id/tomar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tomar reporte en revisión' })
  @ApiOkResponse({ description: 'Reporte cambiado a EN_PROCESO.' })
  @ApiConflictResponse({ description: 'El reporte no puede tomarse en revisión.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  tomarEnRevision(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = this.obtenerUsuario(solicitud, respuesta);
    return this.reportePublicacionService.tomarEnRevision(id, user.idCuenta);
  }

  @Post(':id/descartar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Descartar reporte sin modificar la publicación' })
  @ApiOkResponse({ description: 'Reporte descartado.' })
  @ApiConflictResponse({ description: 'El reporte ya fue resuelto o descartado.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  descartar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = this.obtenerUsuario(solicitud, respuesta);
    return this.reportePublicacionService.descartar(id, user.idCuenta);
  }

  @Post(':id/reabrir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir reporte resuelto o descartado' })
  @ApiOkResponse({ description: 'Reporte devuelto a PENDIENTE.' })
  @ApiConflictResponse({ description: 'El reporte no puede reabrirse.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  reabrir(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = this.obtenerUsuario(solicitud, respuesta);
    return this.reportePublicacionService.reabrir(id, user.idCuenta);
  }

  @Post(':id/resolver/retirar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar publicación y resolver reporte' })
  @ApiOkResponse({ description: 'Publicación retirada, reporte resuelto y aviso registrado.' })
  @ApiConflictResponse({ description: 'El reporte ya fue resuelto o descartado.' })
  @ApiNotFoundResponse({ description: 'Reporte o publicación no encontrado.' })
  retirarPublicacion(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RetirarPublicacionReportePublicacionDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = this.obtenerUsuario(solicitud, respuesta);
    return this.reportePublicacionService.retirarPublicacion(
      id,
      user.idCuenta,
      dto.motivo,
    );
  }

  @Post(':id/resolver/advertir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver reporte registrando advertencia al vendedor' })
  @ApiOkResponse({ description: 'Advertencia registrada sin entrega de notificación.' })
  @ApiBadRequestResponse({ description: 'Mensaje de advertencia requerido.' })
  @ApiConflictResponse({ description: 'El reporte ya fue resuelto o descartado.' })
  @ApiNotFoundResponse({ description: 'Reporte no encontrado.' })
  resolverAdvertencia(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolverAdvertenciaReportePublicacionDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<void> {
    const user = this.obtenerUsuario(solicitud, respuesta);
    return this.reportePublicacionService.resolverAdvertencia(
      id,
      user.idCuenta,
      dto.mensaje,
    );
  }

  private obtenerUsuario(
    solicitud: Request & { user?: SesionAutenticada },
    respuesta: Response,
  ): SesionAutenticada {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    respuesta.locals.authCuentaId = user.idCuenta;
    return user;
  }
}
