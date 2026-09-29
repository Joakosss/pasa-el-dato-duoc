import type { EscuelaDTO } from "@/domain/dtos/catalogo.dto";
import { apiClient } from "./index";

// GET /escuelas -> EscuelaDTO[].
// El back devuelve { id, nombre } y ya ordena por nombre asc.
export async function listarEscuelas(): Promise<EscuelaDTO[]> {
  return apiClient.get<EscuelaDTO[]>("/escuelas");
}
