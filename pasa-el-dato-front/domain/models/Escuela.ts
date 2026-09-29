// Catálogo ESCUELA (id, nombre). Escuela filtra carreras en registro.
// No extiende Base: en BD no tiene auditoría, y su id es number (no uuid).
export interface EscuelaProps {
  id: number;
  nombre: string;
}

export class Escuela {
  readonly id: number;
  nombre: string;

  constructor(props: EscuelaProps) {
    this.id = props.id;
    this.nombre = props.nombre;
  }
}
