import { ApiProperty } from '@nestjs/swagger';

export class SedeBannerMarcaRespuestaDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Sede San Joaquín' })
  nombre!: string;
}

export class BannerMarcaRespuestaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '/api/uploads/banner.png' })
  imagen!: string;

  @ApiProperty({ example: 'Conoce nuestra nueva colección' })
  mensaje!: string;

  @ApiProperty({ format: 'date-time' })
  fechaInicio!: Date;

  @ApiProperty({ format: 'date-time' })
  fechaFin!: Date;

  @ApiProperty({
    enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO'],
    example: 'PENDIENTE',
  })
  estado!: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

  @ApiProperty({ type: [SedeBannerMarcaRespuestaDto] })
  sedes!: SedeBannerMarcaRespuestaDto[];
}

export class ListarBannersMarcaRespuestaDto {
  @ApiProperty({ type: [BannerMarcaRespuestaDto] })
  items!: BannerMarcaRespuestaDto[];

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description:
      'Cursor para solicitar la siguiente página, null si no hay más resultados',
  })
  nextCursor!: string | null;
}
