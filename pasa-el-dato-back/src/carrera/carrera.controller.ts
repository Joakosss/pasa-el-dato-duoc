import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CarreraService } from './carrera.service.js';
import { CarreraRespuestaDto } from './dto/carrera-respuesta.dto.js';
import { ListarCarrerasQueryDto } from './dto/listar-carreras-query.dto.js';

@ApiTags('Carreras')
@Controller('carreras')
export class CarreraController {
  constructor(private readonly carreraService: CarreraService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar carreras, opcionalmente filtradas por escuela',
  })
  @ApiOkResponse({ type: CarreraRespuestaDto, isArray: true })
  listar(
    @Query() consulta: ListarCarrerasQueryDto,
  ): Promise<CarreraRespuestaDto[]> {
    return this.carreraService.listar(consulta.escuelaId);
  }
}
