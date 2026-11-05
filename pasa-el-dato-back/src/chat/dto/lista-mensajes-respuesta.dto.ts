import { ApiProperty } from '@nestjs/swagger';
import { MensajeRespuestaDto } from './mensaje-respuesta.dto.js';

export class ListaMensajesRespuestaDto {
  @ApiProperty({ type: [MensajeRespuestaDto] })
  items!: MensajeRespuestaDto[];

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Cursor para la próxima página (mensajes más antiguos). Es el id del último elemento devuelto. Null si no hay más.',
    example: '6727f2a3e6d8c3b1a1b2c3d4',
  })
  nextCursor!: string | null;
}
