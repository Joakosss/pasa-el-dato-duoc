import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CiudadRespuestaDto } from './dto/ciudad-respuesta.dto.js';
import { ListarCiudadesQueryDto } from './dto/listar-ciudades-query.dto.js';
import { CiudadService } from './ciudad.service.js';

@ApiTags('Ciudades')
@Controller('ciudades')
export class CiudadController {
  constructor(private readonly ciudadService: CiudadService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar las ciudades de una región (regionId obligatorio)',
  })
  @ApiOkResponse({ type: CiudadRespuestaDto, isArray: true })
  listar(
    @Query() consulta: ListarCiudadesQueryDto,
  ): Promise<CiudadRespuestaDto[]> {
    return this.ciudadService.listar(consulta.regionId);
  }
}
