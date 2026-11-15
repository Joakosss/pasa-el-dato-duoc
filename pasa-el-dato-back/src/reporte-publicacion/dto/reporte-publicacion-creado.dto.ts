import { ApiProperty } from '@nestjs/swagger';

// HU-REP-01 (BE03): contrato de respuesta de creación de reporte.
export class ReportePublicacionCreadoDto {
  @ApiProperty({ example: '7c9e6679-742f-48de-9de5-a0db1f8b6506' })
  id!: string;

  @ApiProperty({ example: '0f4a2b3c-1d5e-4f60-9a7b-2c8d9e0f1a2b' })
  publicacionId!: string;

  @ApiProperty({ example: 3 })
  motivoId!: number;

  @ApiProperty({ example: 'Contenido inapropiado', nullable: true })
  comentarios!: string | null;

  @ApiProperty({ example: 'PENDIENTE', enum: ['PENDIENTE'] })
  estado!: 'PENDIENTE';

  @ApiProperty({ example: '2026-11-15T20:30:00.000Z' })
  fechaCreacion!: Date;
}
