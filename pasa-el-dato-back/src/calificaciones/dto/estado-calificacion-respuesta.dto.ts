import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class EstadoCalificacionRespuestaDto {
  @ApiProperty({ example: 'c48d2a2e-0f20-4e0b-8e5f-0b0d99c5c1b2' })
  @IsUUID()
  publicacionId!: string;

  @ApiProperty({
    example: true,
    description:
      'Publicación no eliminada, en estado Vendida y con comprador registrado.',
  })
  @IsBoolean()
  transaccionFinalizada!: boolean;

  @ApiProperty({
    example: true,
    description: 'Valor de calificacion_activada de la publicación.',
  })
  @IsBoolean()
  calificacionActivada!: boolean;

  @ApiProperty({
    example: false,
    description:
      'Existe Calificacion del usuario autenticado hacia su contraparte en esta publicación.',
  })
  @IsBoolean()
  yaCalifico!: boolean;
}
