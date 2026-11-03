import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListarSedesQueryDto } from './dto/listar-sedes-query.dto.js';
import { SedeRespuestaDto } from './dto/sede-respuesta.dto.js';
import { SedeService } from './sede.service.js';

@ApiTags('Sedes')
@Controller('sedes')
export class SedeController {
  constructor(private readonly sedeService: SedeService) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar las sedes predefinidas, opcionalmente filtradas por comuna o disponibilidad',
  })
  @ApiOkResponse({ type: SedeRespuestaDto, isArray: true })
  listar(@Query() consulta: ListarSedesQueryDto): Promise<SedeRespuestaDto[]> {
    return this.sedeService.listar(consulta);
  }
}
