import type { CarreraDTO } from "@/domain/dtos/catalogo.dto";
import type { EscuelaId } from "@/domain/types/common";
import { apiClient } from "./index";

// Respuesta cruda de GET /carreras (back: CarreraRespuestaDto).
// Viene anidada: { id, nombre, escuela:{ id, nombre } }; el dominio la usa plana.
interface CarreraRespuesta {
  id: number;
  nombre: string;
  escuela: {
    id: number;
    nombre: string;
  };
}

// GET /carreras[?escuelaId=N] -> CarreraDTO[] plano.
// Sin escuelaId lista todas; con escuelaId filtra en el servidor.
// El back ya ordena por nombre asc, id asc; se conserva ese orden.
export async function listarCarreras(escuelaId?: EscuelaId | null): Promise<CarreraDTO[]> {
  const carreras = await apiClient.get<CarreraRespuesta[]>("/carreras", {
    query: { escuelaId: escuelaId ?? undefined },
  });
  return carreras.map((carrera) => ({
    id: carrera.id,
    nombre: carrera.nombre,
    escuelaId: carrera.escuela.id,
  }));
}
