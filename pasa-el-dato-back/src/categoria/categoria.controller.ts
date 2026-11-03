import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por id' })
  @ApiOkResponse({ type: CategoriaRespuestaDto })
  @ApiNotFoundResponse({ description: 'Categoría no encontrada' })
  @ApiBadRequestResponse({ description: 'Id inválido' })
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoriaRespuestaDto> {
    return this.categoriaService.obtenerPorId(id);
  }
}
