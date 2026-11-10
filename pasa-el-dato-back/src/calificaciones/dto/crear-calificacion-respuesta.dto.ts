import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearCalificacionRespuestaDto {
  @ApiProperty({ example: '9ad5c91f-8de6-4bf7-9f5c-0b07a4a062d2' })
  id!: string;

  @ApiProperty({ example: 'd8f31862-7f4a-4cc0-bd90-3fb6a9ccf6b1' })
  publicacionId!: string;

  @ApiProperty({ example: 'c1b3ad1c-6b4b-4a77-9f72-8c1dd8b2d6a1' })
  emisorId!: string;

  @ApiProperty({ example: 'b2c6cc52-6f3e-4a4a-9e2e-2b9d0f6f5e11' })
  receptorId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  puntaje!: number;

  @ApiPropertyOptional({ example: 'Todo bien, buen trato.' })
  comentario?: string;

  @ApiProperty({ example: '2026-11-10T04:05:25.123Z' })
  createdAt!: string;
}
