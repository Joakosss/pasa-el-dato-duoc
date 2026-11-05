import { ApiProperty } from '@nestjs/swagger';

export class ConversacionUltimoMensajeDto {
  @ApiProperty()
  texto!: string;

  @ApiProperty()
  enviadoEn!: Date;

  @ApiProperty()
  emisorCuentaId!: string;
}

export class ConversacionPublicacionListaDto {
  @ApiProperty({ description: 'ID de la publicación asociada.' })
  id!: string;

  @ApiProperty({
    description:
      'Estado simplificado para el listado. NO_DISPONIBLE si no es visible/encontrada.',
    example: 'VISIBLE',
  })
  estado!: 'VISIBLE' | 'NO_DISPONIBLE';

  @ApiProperty({
    required: false,
    description:
      'Título de la publicación si está disponible. Se omite si no está visible.',
  })
  titulo?: string;
}

export class ConversacionListaItemDto {
  @ApiProperty({ description: 'ID de la conversación (ObjectId).' })
  conversacionId!: string;

  @ApiProperty()
  contraparteCuentaId!: string;

  @ApiProperty({ type: ConversacionPublicacionListaDto })
  publicacion!: ConversacionPublicacionListaDto;

  @ApiProperty({ required: false, type: ConversacionUltimoMensajeDto })
  ultimoMensaje?: ConversacionUltimoMensajeDto;

  @ApiProperty({
    required: false,
    description:
      'Fecha usada para ordenar el listado (ultimoMensajeEn fallback creadaEn).',
  })
  actividadEn!: Date;
}
