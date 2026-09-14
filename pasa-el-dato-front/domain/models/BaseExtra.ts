import { Base, type BaseProps } from "./Base";

export interface BaseExtraProps extends BaseProps {
  bloqueado: boolean;
  fechaBloqueo: Date | null;
  motivoBloqueo: string | null;
}

// Espejo de BASE-EXTRA del diagrama: solo CUENTA la usa.
export abstract class BaseExtra extends Base {
  bloqueado: boolean;
  fechaBloqueo: Date | null;
  motivoBloqueo: string | null;

  protected constructor(props: BaseExtraProps) {
    super(props);
    this.bloqueado = props.bloqueado;
    this.fechaBloqueo = props.fechaBloqueo;
    this.motivoBloqueo = props.motivoBloqueo;
  }

  get estaActiva(): boolean {
    return !this.eliminado && !this.bloqueado;
  }
}
