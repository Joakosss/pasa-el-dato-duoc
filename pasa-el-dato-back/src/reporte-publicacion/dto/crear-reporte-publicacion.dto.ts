import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { REPORTE_COMENTARIO_MAX_LEN } from '../reportes-publicacion.constantes.js';

// HU-REP-01 (BE03): motivo obligatorio del catálogo, comentarios opcionales.
export class CrearReportePublicacionDto {
  @ApiProperty({
    description: 'Identificador de la publicación reportada (UUID).',
    format: 'uuid',
    example: '0f4a2b3c-1d5e-4f60-9a7b-2c8d9e0f1a2b',
  })
  @IsUUID()
  publicacionId!: string;

  @ApiProperty({
    description: 'Identificador del motivo del catálogo (GET /api/motivos-reporte).',
    example: 3,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  motivoId!: number;

  @ApiPropertyOptional({
    description: `Comentarios libres opcionales (máx. ${REPORTE_COMENTARIO_MAX_LEN} caracteres).`,
    example: 'El precio indicado no coincide con el producto.',
    maxLength: REPORTE_COMENTARIO_MAX_LEN,
  })
  @IsOptional()
  @IsString()
  @MaxLength(REPORTE_COMENTARIO_MAX_LEN)
  comentarios?: string;
}
