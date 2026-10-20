import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionRespuestaDto } from './dto/region-respuesta.dto.js';
import { RegionService } from './region.service.js';

@ApiTags('Regiones')
@Controller('regiones')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Get()
  @ApiOperation({ summary: 'Listar las regiones del catálogo territorial' })
  @ApiOkResponse({ type: RegionRespuestaDto, isArray: true })
  listar(): Promise<RegionRespuestaDto[]> {
    return this.regionService.listar();
  }
}
