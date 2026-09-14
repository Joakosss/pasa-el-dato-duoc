import { Cuenta, type CuentaProps } from "./Cuenta";
import type { CuentaTipo } from "@/domain/types/common";
import type { MarcaDTO } from "@/domain/dtos/cuenta.dto";

export interface MarcaProps extends CuentaProps {
  nombreMarca: string;
}

// Espejo de MARCA (id_cuenta FK + nombre).
export class Marca extends Cuenta {
  readonly tipo: CuentaTipo = "marca";
  nombreMarca: string;

  constructor(props: MarcaProps) {
    super(props);
    this.nombreMarca = props.nombreMarca;
  }

  static fromJSON(dto: MarcaDTO): Marca {
    return new Marca({
      id: dto.id,
      correo: dto.correo,
      telefono: dto.telefono ?? null,
      fechaCreacion: new Date(dto.fechaCreacion),
      fechaModificacion: new Date(dto.fechaModificacion),
      eliminado: dto.eliminado,
      owner: dto.owner ?? null,
      bloqueado: dto.bloqueado,
      fechaBloqueo: dto.fechaBloqueo ? new Date(dto.fechaBloqueo) : null,
      motivoBloqueo: dto.motivoBloqueo ?? null,
      nombreMarca: dto.nombreMarca,
    });
  }

  toJSON(): MarcaDTO {
    return {
      tipo: "marca",
      id: this.id,
      correo: this.correo,
      telefono: this.telefono,
      fechaCreacion: this.fechaCreacion.toISOString(),
      fechaModificacion: this.fechaModificacion.toISOString(),
      eliminado: this.eliminado,
      owner: this.owner,
      bloqueado: this.bloqueado,
      fechaBloqueo: this.fechaBloqueo ? this.fechaBloqueo.toISOString() : null,
      motivoBloqueo: this.motivoBloqueo,
      nombreMarca: this.nombreMarca,
    };
  }

  get displayName(): string {
    return this.nombreMarca.trim() || this.correo;
  }
}
