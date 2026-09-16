import { Cuenta, type CuentaProps } from "./Cuenta";
import type {
  CarreraIdMomentaneo,
  RolIdMomentaneo,
  SedeIdMomentaneo,
} from "@/domain/types/common";
import type { UsuarioDTO } from "@/domain/dtos/cuenta.dto";

export interface UsuarioProps extends CuentaProps {
  run: string;
  pNombre: string;
  sNombre: string | null;
  pApellido: string;
  sApellido: string | null;
  rolId: RolIdMomentaneo;
  sedeId: SedeIdMomentaneo;
  carreraId: CarreraIdMomentaneo;
  correoVerificado: boolean;
}

// Espejo de USUARIO (id_cuenta FK + run UNIQUE + nombres + fk_rol + fk_sede + fk_carrera).
export class Usuario extends Cuenta {
  // Constante solo-front para narrowing (no viene del back, no se envía).
  readonly tipo = "usuario" as const;
  run: string;
  pNombre: string;
  sNombre: string | null;
  pApellido: string;
  sApellido: string | null;
  rolId: RolIdMomentaneo;
  sedeId: SedeIdMomentaneo;
  carreraId: CarreraIdMomentaneo;
  correoVerificado: boolean;

  constructor(props: UsuarioProps) {
    super(props);
    this.run = props.run;
    this.pNombre = props.pNombre;
    this.sNombre = props.sNombre;
    this.pApellido = props.pApellido;
    this.sApellido = props.sApellido;
    this.rolId = props.rolId;
    this.sedeId = props.sedeId;
    this.carreraId = props.carreraId;
    this.correoVerificado = props.correoVerificado;
  }

  static fromJSON(dto: UsuarioDTO): Usuario {
    return new Usuario({
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
      run: dto.run,
      pNombre: dto.pNombre,
      sNombre: dto.sNombre ?? null,
      pApellido: dto.pApellido,
      sApellido: dto.sApellido ?? null,
      rolId: dto.rolId,
      sedeId: dto.sedeId,
      carreraId: dto.carreraId,
      correoVerificado: dto.correoVerificado,
    });
  }

  toJSON(): UsuarioDTO {
    return {
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
      run: this.run,
      pNombre: this.pNombre,
      sNombre: this.sNombre,
      pApellido: this.pApellido,
      sApellido: this.sApellido,
      rolId: this.rolId,
      sedeId: this.sedeId,
      carreraId: this.carreraId,
      correoVerificado: this.correoVerificado,
    };
  }

  get nombreCompleto(): string {
    return [this.pNombre, this.sNombre, this.pApellido, this.sApellido]
      .filter((part) => part && part.trim().length > 0)
      .join(" ");
  }

  get iniciales(): string {
    return [this.pNombre, this.pApellido]
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }
}
