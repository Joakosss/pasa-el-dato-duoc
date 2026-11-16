import { ApiProperty } from '@nestjs/swagger';

export class EstadoFavoritoRespuestaDto {
  @ApiProperty({
    description: 'ID de la publicación consultada o marcada.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  publicacionId!: string;

  @ApiProperty({
    description:
      'Estado actual del favorito activo de la cuenta autenticada sobre la publicación.',
  })
  esFavorito!: boolean;
}
