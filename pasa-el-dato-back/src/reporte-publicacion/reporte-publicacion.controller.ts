import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthLogInterceptor } from '../auth/auth-log.interceptor.js';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { CrearReportePublicacionDto } from './dto/crear-reporte-publicacion.dto.js';
import { ReportePublicacionCreadoDto } from './dto/reporte-publicacion-creado.dto.js';
import { ReportePublicacionService } from './reporte-publicacion.service.js';

// HU-REP-01 (BE07-BE08): flujo de creación de reportes, separado del
// controller administrativo. Cualquier cuenta autenticada puede reportar.
@ApiTags('Reportes de publicación')
@Controller('reportes/publicaciones')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
export class ReportePublicacionController {
  constructor(
    private readonly reportePublicacionService: ReportePublicacionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reportar una publicación',
    description:
      'Registra un reporte PENDIENTE asociado a la publicación con la autoría de la sesión. ' +
      'Solo publicaciones En curso o Vendido son reportables; no se puede reportar la propia publicación ' +
      'ni duplicar un reporte propio en curso.',
  })
  @ApiCreatedResponse({ type: ReportePublicacionCreadoDto })
  @ApiBadRequestResponse({ description: 'Cuerpo o formato de UUID inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiNotFoundResponse({ description: 'Publicación no encontrada.' })
  @ApiConflictResponse({
    description:
      'Publicación no disponible, propia o reporte propio ya en curso.',
  })
  @ApiUnprocessableEntityResponse({ description: 'Motivo inválido.' })
  crear(
    @Body() dto: CrearReportePublicacionDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<ReportePublicacionCreadoDto> {
    const user = this.obtenerUsuario(solicitud, respuesta);

    return this.reportePublicacionService.crear({
      publicacionId: dto.publicacionId,
      motivoId: dto.motivoId,
      comentarios: dto.comentarios,
      idReportante: user.idCuenta,
    });
  }

  // HU-REP-01 (BE02): catálogo de motivos para el selector del formulario.
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
