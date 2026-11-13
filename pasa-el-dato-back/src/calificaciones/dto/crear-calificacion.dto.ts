import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CALIFICACION_COMENTARIO_MAX_LEN } from '../calificaciones.constantes.js';

export class CrearCalificacionDto {
  @ApiProperty({
    description: 'Puntaje entero entre 1 y 5 (incluyente).',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  puntaje!: number;

  @ApiPropertyOptional({
    description: `Comentario opcional (máx. ${CALIFICACION_COMENTARIO_MAX_LEN} caracteres).`,
    example: 'Todo bien, buen trato.',
    maxLength: CALIFICACION_COMENTARIO_MAX_LEN,
  })
  @IsOptional()
  @IsString()
  @MaxLength(CALIFICACION_COMENTARIO_MAX_LEN)
  comentario?: string;
}
