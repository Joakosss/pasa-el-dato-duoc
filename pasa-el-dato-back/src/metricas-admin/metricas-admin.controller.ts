import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthLogInterceptor } from '../auth/auth-log.interceptor.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { DashboardMetricasQueryDto } from './dto/dashboard-metricas-query.dto.js';
import { MetricasAdminService } from './metricas-admin.service.js';

@ApiTags('Administración de métricas')
@Controller('admin/metricas')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
@Roles('Administrador')
export class MetricasAdminController {
  constructor(private readonly metricasAdminService: MetricasAdminService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Consultar dashboard administrativo de métricas',
    description:
      'Calcula bajo demanda usuarios activos, publicaciones por categoría y sede, ventas cerradas y reportes resueltos.',
  })
  @ApiOkResponse({
    description:
      'Métricas agregadas. Si no existen datos, responde 200 con hayDatos=false.',
  })
  @ApiBadRequestResponse({
    description: 'Rango de fechas inválido o superior a 365 días.',
  })
  @ApiNotFoundResponse({ description: 'La sede indicada no existe.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({
    description: 'La sesión no corresponde a un administrador.',
  })
  obtenerDashboard(@Query() query: DashboardMetricasQueryDto) {
    return this.metricasAdminService.obtenerDashboard(query);
  }
}
