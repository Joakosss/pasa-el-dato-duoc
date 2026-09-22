import { ApiProperty } from '@nestjs/swagger';

// Describe la información de una sede que puede recibir el frontend.
export class SedeRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Puente Alto' })
  nombre: string;

  @ApiProperty({ example: true })
  activa: boolean;
}
