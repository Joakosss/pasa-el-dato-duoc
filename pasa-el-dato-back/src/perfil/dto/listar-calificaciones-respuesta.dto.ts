import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CalificacionRecibidaItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  puntaje!: number;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Excelente comprador.',
  })
  comentario!: string | null;

  @ApiProperty({
    format: 'date-time',
    description: 'Fecha en que se registró la calificación.',
  })
  fechaCreacion!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador de la publicación asociada a la transacción.',
  })
  publicacionId!: string;
}

export class ListarCalificacionesRespuestaDto {
  @ApiProperty({ type: [CalificacionRecibidaItemDto] })
  items!: CalificacionRecibidaItemDto[];

  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 10, enum: [10, 20] })
  pageSize!: number;

  @ApiProperty({ example: 12, minimum: 0 })
  total!: number;

  @ApiProperty({
    nullable: true,
    example: 2,
    description: 'Número de la página siguiente o null si no hay más resultados.',
  })
  nextPage!: number | null;
}
