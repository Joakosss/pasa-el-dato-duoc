import type { EscuelaId } from "@/domain/types/common";

export interface CarreraProps {
  id: number;
  nombre: string;
  escuelaId: EscuelaId;
}

// Catálogo CARRERA (id, nombre, fk_escuela). Carrera implica escuela.
// No extiende Base: en BD no tiene auditoría, y su id es number (no uuid).
export class Carrera {
  readonly id: number;
  nombre: string;
  escuelaId: EscuelaId;

  constructor(props: CarreraProps) {
    this.id = props.id;
    this.nombre = props.nombre;
    this.escuelaId = props.escuelaId;
  }
}
