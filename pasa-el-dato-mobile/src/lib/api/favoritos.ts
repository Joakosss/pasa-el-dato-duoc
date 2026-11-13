import { apiClient } from './index';
import type { PublicacionPublica } from './publicaciones';

export interface FavoritoPublicacion extends PublicacionPublica {
  disponible: boolean;
}

export interface ListarFavoritosRespuesta {
  items: FavoritoPublicacion[];
  page: number;
  pageSize: 10 | 20;
  total: number;
  nextPage: number | null;
}

export interface EstadoFavoritoRespuesta {
  publicacionId: string;
  esFavorito: boolean;
}

export function listarFavoritos(
  accessToken: string,
  page = 1,
  pageSize: 10 | 20 = 10,
): Promise<ListarFavoritosRespuesta> {
  return apiClient.get<ListarFavoritosRespuesta>('/favoritos', {
    accessToken,
    query: { page, pageSize },
  });
}

export function obtenerEstadoFavorito(
  publicacionId: string,
  accessToken: string,
): Promise<EstadoFavoritoRespuesta> {
  return apiClient.get<EstadoFavoritoRespuesta>(
    `/favoritos/${encodeURIComponent(publicacionId)}`,
    { accessToken },
  );
}

export function marcarFavorito(
  publicacionId: string,
  accessToken: string,
): Promise<EstadoFavoritoRespuesta> {
  return apiClient.post<EstadoFavoritoRespuesta>(
    `/favoritos/${encodeURIComponent(publicacionId)}`,
    undefined,
    { accessToken },
  );
}

export function quitarFavorito(
  publicacionId: string,
  accessToken: string,
): Promise<void> {
  return apiClient.delete<void>(
    `/favoritos/${encodeURIComponent(publicacionId)}`,
    { accessToken },
  );
}
