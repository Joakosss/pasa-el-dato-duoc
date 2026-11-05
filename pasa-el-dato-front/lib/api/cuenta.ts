import type { DesactivarCuentaRequestDTO } from "@/domain/dtos";
import { apiClient } from "./index";

// POST /cuenta/me/desactivar { confirmacion: true } -> 204 sin cuerpo.
// Requiere sesión válida (cookie HttpOnly). Idempotente: revoca sesiones
// y limpia cookies en el back; el front limpia store y caché propia.
export async function desactivarMiCuentaApi(
  payload: DesactivarCuentaRequestDTO,
): Promise<void> {
  return apiClient.post<void>("/cuenta/me/desactivar", payload);
}
