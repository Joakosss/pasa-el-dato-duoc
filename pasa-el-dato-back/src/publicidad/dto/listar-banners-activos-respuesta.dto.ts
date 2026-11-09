import { ApiProperty } from '@nestjs/swagger';

export class BannerActivoRespuestaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '/api/uploads/banner.png' })
  imagenUrl!: string;

  @ApiProperty({ example: 'Conoce nuestra nueva colección' })
  mensaje!: string;

  @ApiProperty({ format: 'date-time' })
  inicio!: Date;

  @ApiProperty({ format: 'date-time' })
  fin!: Date;

  @ApiProperty({ example: 'Marca Duoc' })
  marcaNombre!: string;
}

export class ListarBannersActivosRespuestaDto {
  @ApiProperty({ type: [BannerActivoRespuestaDto] })
  items!: BannerActivoRespuestaDto[];

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'Cursor para solicitar la siguiente página, null si no hay más resultados',
  })
  nextCursor!: string | null;
}
