import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SedeRespuestaDto } from './dto/sede-respuesta.dto.js';
import { SedeService } from './sede.service.js';

@ApiTags('Sedes')
@Controller('sedes')
export class SedeController {
  constructor(private readonly sedeService: SedeService) {}

  @Get()
  @ApiOperation({ summary: 'Listar las sedes predefinidas' })
  @ApiOkResponse({ type: SedeRespuestaDto, isArray: true })
  listar(): Promise<SedeRespuestaDto[]> {
    return this.sedeService.listar();
  }
}
