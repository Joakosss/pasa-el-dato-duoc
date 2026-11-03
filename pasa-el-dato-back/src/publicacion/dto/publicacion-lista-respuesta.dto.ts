import { ApiProperty } from '@nestjs/swagger';

export class ImagenPublicacionListaRespuestaDto {
  @ApiProperty({ example: 'c5b6d4b0-2e2d-4c6f-9e35-2e5d0f3b9c1a' })
  idImagen!: string;

  @ApiProperty({ example: '/api/uploads/publicacion-1.png' })
  url!: string;

  @ApiProperty({ example: 1 })
  orden!: number;
}

export class CatalogoSimpleRespuestaDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Electrónica' })
  nombre!: string;
}

export class EstadoPublicacionListaRespuestaDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'En curso' })
  descripcion!: string;
}

export class PublicacionListaRespuestaDto {
  @ApiProperty({ example: '5f8c6f06-1c4e-4b6d-9c9f-4fd5b3f2e7a1' })
  id!: string;

  @ApiProperty({ example: 'Notebook Lenovo ThinkPad' })
  titulo!: string;

  @ApiProperty({ example: 'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.' })
  descripcion!: string;

  @ApiProperty({ example: 150000 })
  precio!: number;

  @ApiProperty({ type: EstadoPublicacionListaRespuestaDto })
  estado!: EstadoPublicacionListaRespuestaDto;

  @ApiProperty({ type: CatalogoSimpleRespuestaDto })
  sede!: CatalogoSimpleRespuestaDto;

  @ApiProperty({ type: CatalogoSimpleRespuestaDto })
  tipoVenta!: CatalogoSimpleRespuestaDto;

  @ApiProperty({ type: CatalogoSimpleRespuestaDto })
  categoria!: CatalogoSimpleRespuestaDto;

  @ApiProperty({ type: [ImagenPublicacionListaRespuestaDto] })
  imagenes!: ImagenPublicacionListaRespuestaDto[];
}
