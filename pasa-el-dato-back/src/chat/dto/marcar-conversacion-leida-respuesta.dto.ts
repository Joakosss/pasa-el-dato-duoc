import { ApiProperty } from '@nestjs/swagger';

export class MarcarConversacionLeidaRespuestaDto {
  @ApiProperty({ description: 'ID de la conversación.' })
  conversacionId!: string;

  @ApiProperty({
    nullable: true,
    description:
      'ID del último mensaje de la contraparte marcado como leído. Null si no había mensajes pendientes.',
  })
  leidoHastaMensajeId!: string | null;
}
