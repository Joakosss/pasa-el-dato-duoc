import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComunaRespuestaDto } from './dto/comuna-respuesta.dto.js';
import { ListarComunasQueryDto } from './dto/listar-comunas-query.dto.js';
import { ComunaService } from './comuna.service.js';

@ApiTags('Comunas')
@Controller('comunas')
export class ComunaController {
  constructor(private readonly comunaService: ComunaService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar comunas por región o por ciudad',
  })
  @ApiOkResponse({ type: ComunaRespuestaDto, isArray: true })
  listar(
    @Query() consulta: ListarComunasQueryDto,
  ): Promise<ComunaRespuestaDto[]> {
    return this.comunaService.listar(consulta);
  }
}
