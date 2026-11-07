import { ApiProperty } from '@nestjs/swagger';

export class ConversacionCreadaRespuestaDto {
  @ApiProperty({
    description: 'ID de la conversación en MongoDB.',
    example: '672bd8582b7e6c9b3c1a2f11',
  })
  conversacionId!: string;

  @ApiProperty({
    description: 'Indica si se creó una nueva conversación o se recuperó existente.',
    example: true,
  })
  creada!: boolean;
}
