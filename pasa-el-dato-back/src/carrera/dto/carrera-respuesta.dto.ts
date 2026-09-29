import { ApiProperty } from '@nestjs/swagger';

export class EscuelaDeCarreraDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Escuela de Informática y Telecomunicaciones' })
  nombre: string;
}

// Incluye la escuela para que una lista sin filtro conserve la relación.
export class CarreraRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ingeniería en Informática' })
  nombre: string;

  @ApiProperty({ type: EscuelaDeCarreraDto })
  escuela: EscuelaDeCarreraDto;
}
