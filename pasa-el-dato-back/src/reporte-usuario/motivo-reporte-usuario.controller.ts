import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MotivoReporteUsuarioRespuestaDto } from './dto/motivo-reporte-usuario-respuesta.dto.js';
import { ReporteUsuarioService } from './reporte-usuario.service.js';

// HU-REP-02 (BE02): catálogo público de motivos de reporte de usuario.
// Patrón motivo-reporte (HU-REP-01): lectura sin autenticación para poblar
// el selector del formulario de reporte.
@ApiTags('Reportes de usuario')
@Controller('motivos-reporte-usuario')
export class MotivoReporteUsuarioController {
  constructor(private readonly reporteUsuarioService: ReporteUsuarioService) {}

  @Get()
  @ApiOperation({ summary: 'Listar motivos de reporte de usuario' })
  @ApiOkResponse({ type: MotivoReporteUsuarioRespuestaDto, isArray: true })
  listar(): Promise<MotivoReporteUsuarioRespuestaDto[]> {
    return this.reporteUsuarioService.listarMotivos();
  }
}
