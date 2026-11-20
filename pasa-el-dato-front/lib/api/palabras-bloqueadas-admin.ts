import type {
  CrearPalabraBloqueadaRequestDTO,
  PalabraBloqueadaDTO,
} from "@/domain/dtos/palabra-bloqueada.dto";
import { apiClient } from "./index";

// GET /admin/palabras-bloqueadas -> lista global ordenada por termino asc.
export async function listarPalabrasBloqueadasApi(): Promise<
  PalabraBloqueadaDTO[]
> {
  return apiClient.get<PalabraBloqueadaDTO[]>("/admin/palabras-bloqueadas");
}

// POST /admin/palabras-bloqueadas { termino } -> 201 item.
// 400 termino vacio/invalido; 409 duplicado.
export async function crearPalabraBloqueadaApi(
  dto: CrearPalabraBloqueadaRequestDTO,
): Promise<PalabraBloqueadaDTO> {
  return apiClient.post<PalabraBloqueadaDTO>("/admin/palabras-bloqueadas", {
    termino: dto.termino,
  });
}

// DELETE /admin/palabras-bloqueadas/:id -> 204. 404 inexistente.
export async function eliminarPalabraBloqueadaApi(id: string): Promise<void> {
  await apiClient.delete<void>(
    `/admin/palabras-bloqueadas/${encodeURIComponent(id)}`,
  );
}
