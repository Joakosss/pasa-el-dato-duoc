import { BaseExtra, type BaseExtraProps } from "./BaseExtra";
import type { CuentaTipo } from "@/domain/types/common";

export interface CuentaProps extends BaseExtraProps {
  correo: string;
  telefono: string | null;
}

// Espejo de CUENTA (id_cuenta PK, correo UNIQUE, telefono + BASE-EXTRA).
// clave_hash nunca viaja al front (decisión aprobada).
export abstract class Cuenta extends BaseExtra {
  abstract readonly tipo: CuentaTipo;
  correo: string;
  telefono: string | null;

  protected constructor(props: CuentaProps) {
    super(props);
    this.correo = props.correo;
    this.telefono = props.telefono;
  }
}
