import type { CategoriaDTO } from "@/domain/dtos/catalogo.dto";
import { apiClient } from "./index";

// GET /categorias -> CategoriaDTO[].
// El back devuelve { id, nombre } y ya ordena por nombre asc.
export async function listarCategorias(): Promise<CategoriaDTO[]> {
  return apiClient.get<CategoriaDTO[]>("/categorias");
}
