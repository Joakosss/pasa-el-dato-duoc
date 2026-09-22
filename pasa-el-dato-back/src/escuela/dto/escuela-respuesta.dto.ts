import { ApiProperty } from '@nestjs/swagger';

// Describe la información pública de una escuela.
export class EscuelaRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Escuela de Informática y Telecomunicaciones' })
  nombre: string;
}
