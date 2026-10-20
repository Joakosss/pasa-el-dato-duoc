import { ApiProperty } from '@nestjs/swagger';

// Describe la información pública de una región del catálogo territorial.
export class RegionRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Región Metropolitana de Santiago' })
  nombre: string;

  @ApiProperty({ example: '13' })
  codigoSubdere: string;
}
