import { ApiProperty } from '@nestjs/swagger';
import {
  CategoriaRespuestaDto,
  ImagenPublicacionRespuestaDto,
  SedePublicacionRespuestaDto,
  TipoVentaRespuestaDto,
} from './publicacion-creada-respuesta.dto.js';

// Respuesta 200 de GET /api/publicaciones/:id/edicion (HU-PUB-02).
export class PublicacionEdicionRespuestaDto {
  @ApiProperty({ example: 'uuid-publicacion' })
  id: string;

  @ApiProperty({ example: 'Notebook Lenovo ThinkPad' })
  titulo: string;

  @ApiProperty({ example: 'Notebook en buen estado, 16 GB de RAM.' })
  descripcion: string;

  @ApiProperty({ example: 150000 })
  precio: number;

  @ApiProperty({ type: SedePublicacionRespuestaDto })
  sede: SedePublicacionRespuestaDto;

  @ApiProperty({ type: TipoVentaRespuestaDto })
  tipoVenta: TipoVentaRespuestaDto;

  @ApiProperty({ type: CategoriaRespuestaDto })
  categoria: CategoriaRespuestaDto;

  @ApiProperty({ type: [ImagenPublicacionRespuestaDto] })
  imagenes: ImagenPublicacionRespuestaDto[];
}
