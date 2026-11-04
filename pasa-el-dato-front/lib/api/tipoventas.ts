import type { TipoVentaDTO } from "@/domain/dtos/catalogo.dto";
import { apiClient } from "./index";

// GET /tipoventas -> TipoVentaDTO[].
// El back devuelve { id, nombre } y ya ordena por nombre asc.
export async function listarTipoventas(): Promise<TipoVentaDTO[]> {
  return apiClient.get<TipoVentaDTO[]>("/tipoventas");
}
