export const EMAIL_NOTIFICACIONES_PORT = Symbol('EMAIL_NOTIFICACIONES_PORT');

export interface EmailNotificacionEntrada {
  destinatario: string;
  tipo: string;
  mensaje: string;
  dataJson: Record<string, unknown> | null;
}

export interface EmailNotificacionesPort {
  enviar(entrada: EmailNotificacionEntrada): Promise<void>;
}
