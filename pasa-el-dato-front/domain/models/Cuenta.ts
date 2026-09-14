import { BaseExtra, type BaseExtraProps } from "./BaseExtra";

export interface CuentaProps extends BaseExtraProps {
  correo: string;
  telefono: string | null;
}

// Espejo de CUENTA (id_cuenta PK, correo UNIQUE, telefono + BASE-EXTRA).
// clave_hash nunca viaja al front (decisión aprobada).
// Sin discriminador: el back expone /usuarios y /marcas por separado.
export abstract class Cuenta extends BaseExtra {
  correo: string;
  telefono: string | null;

  protected constructor(props: CuentaProps) {
    super(props);
    this.correo = props.correo;
    this.telefono = props.telefono;
  }
}
