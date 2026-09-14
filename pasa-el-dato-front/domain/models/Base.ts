import type { ID } from "@/domain/types/common";

export interface BaseProps {
  id: ID;
  fechaCreacion: Date;
  fechaModificacion: Date;
  eliminado: boolean;
  owner: string | null;
}

// Espejo de BASE del diagrama BD SQL: auditoría común a todas las tablas verdes.
export abstract class Base {
  readonly id: ID;
  readonly fechaCreacion: Date;
  fechaModificacion: Date;
  eliminado: boolean;
  owner: string | null;

  protected constructor(props: BaseProps) {
    this.id = props.id;
    this.fechaCreacion = props.fechaCreacion;
    this.fechaModificacion = props.fechaModificacion;
    this.eliminado = props.eliminado;
    this.owner = props.owner;
  }

  get estaEliminada(): boolean {
    return this.eliminado;
  }
}

