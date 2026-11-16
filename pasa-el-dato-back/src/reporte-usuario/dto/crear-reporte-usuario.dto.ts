import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { REPORTE_USUARIO_COMENTARIO_MAX_LEN } from '../reportes-usuario.constantes.js';

// HU-REP-02 (BE03): motivo obligatorio del catálogo, comentarios opcionales.
export class CrearReporteUsuarioDto {
  @ApiProperty({
    description: 'Identificador de la cuenta reportada (UUID).',
    format: 'uuid',
    example: '0f4a2b3c-1d5e-4f60-9a7b-2c8d9e0f1a2b',
  })
  @IsUUID()
  usuarioReportadoId!: string;

  @ApiProperty({
    description:
      'Identificador del motivo del catálogo (GET /api/motivos-reporte-usuario).',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  motivoId!: number;

  @ApiPropertyOptional({
    description: `Comentarios libres opcionales (máx. ${REPORTE_USUARIO_COMENTARIO_MAX_LEN} caracteres).`,
    example: 'Me estafó en la venta del cargador.',
    maxLength: REPORTE_USUARIO_COMENTARIO_MAX_LEN,
  })
  @IsOptional()
  @IsString()
  @MaxLength(REPORTE_USUARIO_COMENTARIO_MAX_LEN)
  comentarios?: string;
}
