import { ApiProperty } from '@nestjs/swagger';

export class ReputacionRespuestaDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Identificador de la cuenta del usuario.',
  })
  usuarioId!: string;

  @ApiProperty({
    nullable: true,
    example: 4.5,
    description:
      'Promedio de puntajes recibidos. Es null cuando el usuario no tiene calificaciones.',
  })
  promedio!: number | null;

  @ApiProperty({
    example: 12,
    minimum: 0,
    description: 'Cantidad total de calificaciones recibidas.',
  })
  total!: number;
}
