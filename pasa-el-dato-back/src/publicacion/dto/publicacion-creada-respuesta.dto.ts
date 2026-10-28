import { ApiProperty } from '@nestjs/swagger';

// Imagen devuelta en la respuesta 201 de POST /api/publicaciones.
export class ImagenPublicacionRespuestaDto {
  @ApiProperty({ example: 'b1a2c3d4-...' })
  idImagen: string;

  @ApiProperty({ example: '/api/uploads/b1a2c3d4-....png' })
  url: string;

  @ApiProperty({ example: 1 })
  orden: number;
}

export class EstadoPublicacionRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'En curso' })
  descripcion: string;
}

export class SedePublicacionRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Puente Alto' })
  nombre: string;
}

export class TipoVentaRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Producto' })
  nombre: string;
}

export class CategoriaRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Electrónica' })
  nombre: string;
}

// Respuesta 201 de POST /api/publicaciones (HU-PUB-01, T-10).
export class PublicacionCreadaRespuestaDto {
  @ApiProperty({ example: 'uuid-publicacion' })
  id: string;

  @ApiProperty({ example: 'Notebook Lenovo ThinkPad' })
  titulo: string;

  @ApiProperty({ example: 'Notebook en buen estado, 16 GB de RAM.' })
  descripcion: string;

  @ApiProperty({ example: 150000 })
  precio: number;

  @ApiProperty({ type: EstadoPublicacionRespuestaDto })
  estado: EstadoPublicacionRespuestaDto;

  @ApiProperty({ type: SedePublicacionRespuestaDto })
  sede: SedePublicacionRespuestaDto;

  @ApiProperty({ type: TipoVentaRespuestaDto })
  tipoVenta: TipoVentaRespuestaDto;

  @ApiProperty({ type: CategoriaRespuestaDto })
  categoria: CategoriaRespuestaDto;

  @ApiProperty({ type: [ImagenPublicacionRespuestaDto] })
  imagenes: ImagenPublicacionRespuestaDto[];
}
