import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearReportePublicacionDto {
  @ApiProperty({
    description: 'Motivo por el que se reporta la publicación.',
    example: 'publicacion-sospechosa',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  motivo!: string;

  @ApiPropertyOptional({
    description: 'Información adicional para que el equipo pueda revisar el reporte.',
    example: 'El precio es inusualmente bajo y las imágenes parecen de otro aviso.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentarios?: string;
}
