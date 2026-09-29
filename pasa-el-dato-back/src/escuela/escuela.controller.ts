import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EscuelaRespuestaDto } from './dto/escuela-respuesta.dto.js';
import { EscuelaService } from './escuela.service.js';

@ApiTags('Escuelas')
@Controller('escuelas')
export class EscuelaController {
  constructor(private readonly escuelaService: EscuelaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar las escuelas predefinidas' })
  @ApiOkResponse({ type: EscuelaRespuestaDto, isArray: true })
  listar(): Promise<EscuelaRespuestaDto[]> {
    return this.escuelaService.listar();
  }
}
