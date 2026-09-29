import type { SedeDTO } from "@/domain/dtos/catalogo.dto";
import { apiClient } from "./index";

// GET /sedes -> SedeDTO[] (solo activas).
// El back devuelve { id, nombre, activa } y ya ordena por nombre asc.
export async function listarSedes(): Promise<SedeDTO[]> {
  const sedes = await apiClient.get<SedeDTO[]>("/sedes");
  return sedes.filter((sede) => sede.activa);
}
