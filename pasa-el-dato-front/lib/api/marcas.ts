import type {
  CrearMarcaAdminRequestDTO,
  MarcaAdminCreadaDTO,
} from "@/domain/dtos/marca.dto";
import { apiClient } from "./index";

// POST /admin/marcas -> cuenta de marca creada y autorizada (201).
// Requiere sesión de administrador.
export async function crearMarcaAdminApi(
  payload: CrearMarcaAdminRequestDTO,
): Promise<MarcaAdminCreadaDTO> {
  return apiClient.post<MarcaAdminCreadaDTO>("/admin/marcas", payload);
}
