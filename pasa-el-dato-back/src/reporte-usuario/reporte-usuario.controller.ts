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
import { CrearReporteUsuarioDto } from './dto/crear-reporte-usuario.dto.js';
import { ReporteUsuarioCreadoDto } from './dto/reporte-usuario-creado.dto.js';
import { ReporteUsuarioService } from './reporte-usuario.service.js';

// HU-REP-02 (BE07-BE08): flujo de creación de reportes de usuario, separado
// del controller administrativo. Cualquier cuenta autenticada puede reportar.
@ApiTags('Reportes de usuario')
@Controller('reportes/usuarios')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
export class ReporteUsuarioController {
  constructor(private readonly reporteUsuarioService: ReporteUsuarioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reportar a otro usuario',
    description:
      'Registra un reporte PENDIENTE contra la cuenta indicada con la autoría de la sesión. ' +
      'No se puede reportar al usuario de la propia sesión, a un usuario eliminado ni ' +
      'duplicar un reporte propio en curso contra el mismo usuario.',
  })
  @ApiCreatedResponse({ type: ReporteUsuarioCreadoDto })
  @ApiBadRequestResponse({ description: 'Cuerpo o formato de UUID inválido.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiNotFoundResponse({ description: 'Usuario reportado no encontrado.' })
  @ApiConflictResponse({
    description:
      'Usuario eliminado, autoreporte o reporte propio ya en curso.',
  })
  @ApiUnprocessableEntityResponse({ description: 'Motivo inválido.' })
  crear(
    @Body() dto: CrearReporteUsuarioDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<ReporteUsuarioCreadoDto> {
    const user = this.obtenerUsuario(solicitud, respuesta);

    return this.reporteUsuarioService.crear({
      usuarioReportadoId: dto.usuarioReportadoId,
      motivoId: dto.motivoId,
      comentarios: dto.comentarios,
      idReportante: user.idCuenta,
    });
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
