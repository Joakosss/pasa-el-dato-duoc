import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsUUID } from 'class-validator';

export class ActivarCalificacionRespuestaDto {
  @ApiProperty({ example: 'c48d2a2e-0f20-4e0b-8e5f-0b0d99c5c1b2' })
  @IsUUID()
  publicacionId!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  calificacionActivada!: boolean;

  @ApiProperty({
    example: '2026-11-10T05:02:22.000Z',
    nullable: true,
    description: 'Fecha/hora de activación. Si ya estaba activada, se mantiene.',
  })
  @IsDateString()
  fechaActivacionCalificacion!: string | null;
}
