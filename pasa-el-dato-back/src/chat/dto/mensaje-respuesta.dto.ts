import { ApiProperty } from '@nestjs/swagger';

export class MensajeRespuestaDto {
  @ApiProperty({ description: 'ID del mensaje (ObjectId como string).' })
  id!: string;

  @ApiProperty({ description: 'ID de la conversación (ObjectId como string).' })
  conversacionId!: string;

  @ApiProperty({ description: 'ID de la cuenta emisora (PostgreSQL UUID).' })
  emisorCuentaId!: string;

  @ApiProperty({ description: 'Texto del mensaje.' })
  texto!: string;

  @ApiProperty({ description: 'Timestamp de envío.' })
  enviadoEn!: Date;

  @ApiProperty({
    description: 'Indica si el mensaje de la contraparte fue leído por el usuario.',
  })
  leido!: boolean;

  @ApiProperty({
    description: 'Indica si la contraparte leyó el mensaje enviado por el usuario.',
  })
  leidoPorContraparte!: boolean;
}
