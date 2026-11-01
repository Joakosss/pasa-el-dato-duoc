import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriaRespuestaDto } from './dto/categoria-respuesta.dto.js';
import { CategoriaService } from './categoria.service.js';

@ApiTags('Categorías')
@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar las categorías de publicaciones' })
  @ApiOkResponse({ type: CategoriaRespuestaDto, isArray: true })
  listar(): Promise<CategoriaRespuestaDto[]> {
    return this.categoriaService.listar();
  }
}
