import { ApiProperty } from '@nestjs/swagger';

// Describe la información pública de una comuna del catálogo territorial.
export class ComunaRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Puente Alto' })
  nombre: string;

  @ApiProperty({ example: '13201', description: 'Código SUBDERE de la comuna' })
  codigoSubdere: string;

  @ApiProperty({ example: 13, description: 'Región a la que pertenece' })
  regionId: number;
}
