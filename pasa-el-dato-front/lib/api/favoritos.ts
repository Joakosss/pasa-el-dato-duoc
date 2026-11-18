import type {
  EstadoFavoritoDTO,
  ListarFavoritosQueryDTO,
  PaginaFavoritosDTO,
} from "@/domain/dtos/favorito.dto";
import { apiClient } from "./index";

// GET /favoritos (cookie accessToken) — listado paginado de favoritos de la
// cuenta autenticada. La web pide pageSize=20 (la app móvil, 10). Los
// items traen `disponible` para saber si la publicación sigue en catálogo.
export async function listarFavoritosApi(
  dto: ListarFavoritosQueryDTO = {},
): Promise<PaginaFavoritosDTO> {
  return apiClient.get<PaginaFavoritosDTO>("/favoritos", {
    query: { page: dto.page, pageSize: dto.pageSize },
  });
}

// GET /favoritos/:publicacionId (cookie accessToken) — estado de favorito
// de la cuenta autenticada. 200 siempre que el UUID sea válido y haya sesión.
export async function obtenerEstadoFavoritoApi(
  publicacionId: string,
): Promise<EstadoFavoritoDTO> {
  return apiClient.get<EstadoFavoritoDTO>(
    `/favoritos/${encodeURIComponent(publicacionId)}`,
  );
}

// POST /favoritos/:publicacionId — marca como favorita.
// 201 { esFavorito: true }. 400 propia, 404 no disponible, 401 sin sesión.
export async function marcarFavoritoApi(
  publicacionId: string,
): Promise<EstadoFavoritoDTO> {
  return apiClient.post<EstadoFavoritoDTO>(
    `/favoritos/${encodeURIComponent(publicacionId)}`,
  );
}

// DELETE /favoritos/:publicacionId — quita de favoritos (baja lógica).
// 200 { esFavorito: false }. Idempotente.
export async function quitarFavoritoApi(
  publicacionId: string,
): Promise<EstadoFavoritoDTO> {
  return apiClient.delete<EstadoFavoritoDTO>(
    `/favoritos/${encodeURIComponent(publicacionId)}`,
  );
}
