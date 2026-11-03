import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TipoVentaRespuestaDto } from './dto/tipo-venta-respuesta.dto.js';
import { TipoVentaService } from './tipo-venta.service.js';

@ApiTags('Tipos de venta')
@Controller('tipoventas')
export class TipoVentaController {
  constructor(private readonly tipoVentaService: TipoVentaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar los tipos de venta de publicaciones' })
  @ApiOkResponse({ type: TipoVentaRespuestaDto, isArray: true })
  listar(): Promise<TipoVentaRespuestaDto[]> {
    return this.tipoVentaService.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de venta por id' })
  @ApiOkResponse({ type: TipoVentaRespuestaDto })
  @ApiNotFoundResponse({ description: 'Tipo de venta no encontrado' })
  @ApiBadRequestResponse({ description: 'Id inválido' })
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TipoVentaRespuestaDto> {
    return this.tipoVentaService.obtenerPorId(id);
  }
}
