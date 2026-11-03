import { ApiProperty } from '@nestjs/swagger';

// Describe la información pública de una ciudad del catálogo territorial.
export class CiudadRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  // Las ciudades antiguas pueden no tener identificador oficial.
  @ApiProperty({
    example: '1310100100101',
    nullable: true,
    type: String,
    description: 'Identificador oficial CPAC 2024',
  })
  idEntidad: string | null;

  @ApiProperty({ example: 'Puente Alto' })
  nombre: string;

  @ApiProperty({ example: 1, description: 'Región a la que pertenece' })
  regionId: number;
}
