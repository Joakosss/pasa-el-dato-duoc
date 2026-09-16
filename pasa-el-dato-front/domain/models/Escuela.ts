import { Base, type BaseProps } from "./Base";

export interface EscuelaProps extends BaseProps {
  nombre: string;
}

// Catálogo ESCUELA (id, nombre). Escuela filtra carreras en registro.
export class Escuela extends Base {
  nombre: string;

  constructor(props: EscuelaProps) {
    super(props);
    this.nombre = props.nombre;
  }
}
