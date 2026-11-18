import type { PublicacionListaDTO } from "./publicacion.dto";

// Espejo de FavoritoListaItemDto del back (GET /favoritos): la publicación
// favorita más el indicador de si sigue visible en el catálogo público.
export interface FavoritoDTO extends PublicacionListaDTO {
  disponible: boolean;
}

// Espejo de EstadoFavoritoRespuestaDto del back
// (GET/POST/DELETE /favoritos/:publicacionId).
export interface EstadoFavoritoDTO {
  publicacionId: string;
  esFavorito: boolean;
}

// Parámetros de GET /favoritos. El back solo admite pageSize 10 | 20;
// la web usa 20 (la app móvil usa 10).
export interface ListarFavoritosQueryDTO {
  page?: number;
  pageSize?: 10 | 20;
}

// Espejo de ListarFavoritosRespuestaDto del back.
export interface PaginaFavoritosDTO {
  items: FavoritoDTO[];
  page: number;
  pageSize: number;
  total: number;
  nextPage: number | null;
}
