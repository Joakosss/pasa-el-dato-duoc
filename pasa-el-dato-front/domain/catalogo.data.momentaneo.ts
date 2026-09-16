import type {
  CarreraDTO,
  EscuelaDTO,
  SedeDTO,
} from "@/domain/dtos/catalogo.dto";

// TODO[MOMENTANEO]: reemplazar por fetch a /sedes, /escuelas, /carreras.
export const SEDES_MOMENTANEO: SedeDTO[] = [
  { id: "1", nombre: "Sede Puente Alto" }
];

export const ESCUELAS_MOMENTANEO: EscuelaDTO[] = [
  { id: "1", nombre: "Escuela de prueba" },
];

export const CARRERAS_MOMENTANEO: CarreraDTO[] = [
  { id: "1", nombre: "Carrera de prueba", escuelaId: "1" },
];

export function carrerasPorEscuelaMomentaneo(escuelaId: string): CarreraDTO[] {
  return CARRERAS_MOMENTANEO.filter((c) => c.escuelaId === escuelaId);
}
