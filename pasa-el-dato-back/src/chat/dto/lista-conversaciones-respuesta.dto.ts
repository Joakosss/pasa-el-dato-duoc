import { ApiProperty } from '@nestjs/swagger';
import { ConversacionListaItemDto } from './conversacion-lista-item.dto.js';

export class ListaConversacionesRespuestaDto {
  @ApiProperty({ type: [ConversacionListaItemDto] })
  items!: ConversacionListaItemDto[];

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Cursor para la siguiente página (null si no hay más).',
  })
  nextCursor!: string | null;
}
