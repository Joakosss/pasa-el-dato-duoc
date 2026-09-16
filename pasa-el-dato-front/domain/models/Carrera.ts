import { Base, type BaseProps } from "./Base";
import type { EscuelaIdMomentaneo } from "@/domain/types/common";

export interface CarreraProps extends BaseProps {
  nombre: string;
  escuelaId: EscuelaIdMomentaneo;
}

// Catálogo CARRERA (id, nombre, fk_escuela). Carrera implica escuela.
export class Carrera extends Base {
  nombre: string;
  escuelaId: EscuelaIdMomentaneo;

  constructor(props: CarreraProps) {
    super(props);
    this.nombre = props.nombre;
    this.escuelaId = props.escuelaId;
  }
}
