import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MotivoReporteRespuestaDto } from './dto/motivo-reporte-respuesta.dto.js';
import { ReportePublicacionService } from './reporte-publicacion.service.js';

// HU-REP-01 (BE02): catálogo público de motivos de reporte de publicación.
// Patrón tipo-venta/categoria: lectura sin autenticación para poblar
// el selector del formulario de reporte.
@ApiTags('Reportes de publicación')
@Controller('motivos-reporte')
export class MotivoReporteController {
  constructor(
    private readonly reportePublicacionService: ReportePublicacionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar motivos de reporte de publicación' })
  @ApiOkResponse({ type: MotivoReporteRespuestaDto, isArray: true })
  listar(): Promise<MotivoReporteRespuestaDto[]> {
    return this.reportePublicacionService.listarMotivos();
  }
}
