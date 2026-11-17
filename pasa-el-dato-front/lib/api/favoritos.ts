import type {
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
