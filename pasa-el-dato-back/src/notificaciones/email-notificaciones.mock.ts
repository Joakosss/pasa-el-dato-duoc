import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailNotificacionEntrada,
  EmailNotificacionesPort,
} from './email-notificaciones.port.js';

@Injectable()
export class EmailNotificacionesMock implements EmailNotificacionesPort {
  private readonly logger = new Logger(EmailNotificacionesMock.name);

  async enviar(entrada: EmailNotificacionEntrada): Promise<void> {
    this.logger.log(
      `[MVP MOCK] correo=${entrada.destinatario} tipo=${entrada.tipo} mensaje=${entrada.mensaje}`,
    );
  }
}
