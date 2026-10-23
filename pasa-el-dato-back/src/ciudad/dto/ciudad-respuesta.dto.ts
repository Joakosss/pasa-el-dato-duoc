import { ApiProperty } from '@nestjs/swagger';

// Describe la información pública de una ciudad del catálogo territorial.
export class CiudadRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Puente Alto' })
  nombre: string;

  @ApiProperty({ example: 1, description: 'Región a la que pertenece' })
  regionId: number;
}
