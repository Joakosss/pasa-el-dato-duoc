import { ApiProperty } from '@nestjs/swagger';
import { PublicacionListaRespuestaDto } from '../../publicacion/dto/publicacion-lista-respuesta.dto.js';

export class FavoritoListaItemDto extends PublicacionListaRespuestaDto {
  @ApiProperty({
    description:
      'Indica si la publicación sigue visible como disponible en el catálogo público.',
    example: true,
  })
  disponible!: boolean;
}

export class ListarFavoritosRespuestaDto {
  @ApiProperty({ type: [FavoritoListaItemDto] })
  items!: FavoritoListaItemDto[];

  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 20, enum: [10, 20] })
  pageSize!: number;

  @ApiProperty({ example: 42, minimum: 0 })
  total!: number;

  @ApiProperty({
    nullable: true,
    example: 2,
    description: 'Número de la página siguiente, o null cuando no hay más páginas.',
  })
  nextPage!: number | null;
}
