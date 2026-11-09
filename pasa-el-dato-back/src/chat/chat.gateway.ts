import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ConversacionAbiertaWsDto,
  type ConversacionLeidaWsRespuesta,
  EnviarMensajeWsDto,
  type MensajeWsRespuesta,
  type SincronizacionMensajesWsRespuesta,
  UnirseConversacionWsDto,
} from './dto/ws-chat.dto.js';
import { ChatService } from './chat.service.js';

interface SesionWs {
  idCuenta: string;
}

type SocketChat = Socket & {
  data: {
    sesion?: SesionWs;
  };
};

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(cliente: SocketChat): Promise<void> {
    try {
      const sesion = await this.autenticar(cliente);
      cliente.data.sesion = sesion;
      this.logger.log(`Conexión WS aceptada para cuenta ${sesion.idCuenta}`);
    } catch {
      this.logger.warn('Conexión WS rechazada por sesión inválida');
      cliente.disconnect(true);
    }
  }

  handleDisconnect(cliente: SocketChat): void {
    const cuentaId = cliente.data.sesion?.idCuenta;
    this.logger.log(
      cuentaId
        ? `Conexión WS cerrada para cuenta ${cuentaId}`
        : 'Conexión WS cerrada sin sesión autenticada',
    );
  }

  @SubscribeMessage('chat:join_conversacion')
  async unirseConversacion(
    @ConnectedSocket() cliente: SocketChat,
    @MessageBody() dto: UnirseConversacionWsDto,
  ): Promise<SincronizacionMensajesWsRespuesta> {
    const sesion = this.obtenerSesion(cliente);

    try {
      await this.chatService.asegurarParticipante({
        conversacionId: dto.conversacionId,
        cuentaId: sesion.idCuenta,
      });

      await cliente.join(this.room(dto.conversacionId));

      const resultado = await this.chatService.listarMensajesPaginados({
        conversacionId: dto.conversacionId,
        cuentaId: sesion.idCuenta,
        cursor: dto.cursor,
        limit: dto.limit ?? 20,
      });

      const respuesta: SincronizacionMensajesWsRespuesta = {
        conversacionId: dto.conversacionId,
        items: resultado.items
          .reverse()
          .map((item) => this.mapearMensaje(item)),
        nextCursor: resultado.nextCursor,
      };

      this.logger.log(
        `Cuenta ${sesion.idCuenta} se unió a conversación ${dto.conversacionId}`,
      );

      return respuesta;
    } catch (error) {
      throw this.convertirErrorWs(error);
    }
  }

  emitirMensajeNuevo(mensaje: {
    _id: unknown;
    conversacionId: unknown;
    emisorCuentaId: string;
    texto: string;
    enviadoEn: Date;
  }): void {
    this.server
      .to(this.room(String(mensaje.conversacionId)))
      .emit('chat:mensaje_nuevo', this.mapearMensaje(mensaje));
  }

  @SubscribeMessage('chat:enviar_mensaje')
  async enviarMensaje(
    @ConnectedSocket() cliente: SocketChat,
    @MessageBody() dto: EnviarMensajeWsDto,
  ): Promise<MensajeWsRespuesta> {
    const sesion = this.obtenerSesion(cliente);

    try {
      const mensaje = await this.chatService.enviarMensaje({
        conversacionId: dto.conversacionId,
        cuentaId: sesion.idCuenta,
        texto: dto.texto,
      });

      const respuesta = this.mapearMensaje(mensaje);

      this.emitirMensajeNuevo(mensaje);

      this.logger.log(
        `Mensaje ${respuesta.id} emitido en conversación ${dto.conversacionId}`,
      );

      return respuesta;
    } catch (error) {
      throw this.convertirErrorWs(error);
    }
  }

  @SubscribeMessage('chat:conversacionAbierta')
  async conversacionAbierta(
    @ConnectedSocket() cliente: SocketChat,
    @MessageBody() dto: ConversacionAbiertaWsDto,
  ): Promise<ConversacionLeidaWsRespuesta> {
    const sesion = this.obtenerSesion(cliente);

    try {
      const resultado = await this.chatService.marcarConversacionComoLeida({
        conversacionId: dto.conversacionId,
        cuentaId: sesion.idCuenta,
      });

      this.logger.log(
        `Cuenta ${sesion.idCuenta} marcó conversación ${dto.conversacionId} como leída (hasta ${resultado.leidoHastaMensajeId ?? 'null'})`,
      );

      return resultado;
    } catch (error) {
      throw this.convertirErrorWs(error);
    }
  }

  private async autenticar(cliente: Socket): Promise<SesionWs> {
    // La cookie conserva prioridad para web. Mobile usa auth.token porque
    // React Native no dispone de un cookie jar HTTP confiable.
    const token =
      this.obtenerCookie(cliente.handshake.headers.cookie, 'accessToken') ??
      this.obtenerTokenDeHandshake(cliente.handshake.auth);

    if (!token) {
      throw new Error('Sesión WS ausente');
    }

    const payload = await this.jwtService.verifyAsync<{
      sub?: unknown;
      jti?: unknown;
    }>(token);

    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('Sesión WS inválida');
    }

    if (typeof payload.jti !== 'string' || !payload.jti) {
      throw new Error('Sesión WS inválida');
    }

    const revocado = await this.prisma.accessTokenRevocado.findUnique({
      where: { jti: payload.jti },
    });

    if (revocado) {
      throw new Error('Sesión WS revocada');
    }

    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: payload.sub },
      select: {
        aprobada: true,
        bloqueado: true,
        eliminado: true,
      },
    });

    const usuario = await this.prisma.usuario.findUnique({
      where: { id_cuenta: payload.sub },
      select: { id_cuenta: true },
    });

    if (
      !cuenta ||
      !usuario ||
      cuenta.bloqueado ||
      cuenta.eliminado ||
      !cuenta.aprobada
    ) {
      throw new Error('Cuenta WS inválida');
    }

    return { idCuenta: payload.sub };
  }

  private obtenerSesion(cliente: SocketChat): SesionWs {
    const sesion = cliente.data.sesion;
    if (!sesion) {
      throw new WsException('Sesión inválida');
    }
    return sesion;
  }

  private room(conversacionId: string): string {
    return `conversacion:${conversacionId}`;
  }

  private mapearMensaje(mensaje: {
    _id: unknown;
    conversacionId: unknown;
    emisorCuentaId: string;
    texto: string;
    enviadoEn: Date;
  }): MensajeWsRespuesta {
    return {
      id: String(mensaje._id),
      conversacionId: String(mensaje.conversacionId),
      emisorCuentaId: mensaje.emisorCuentaId,
      texto: mensaje.texto,
      enviadoEn: mensaje.enviadoEn,
    };
  }

  private convertirErrorWs(error: unknown): WsException {
    if (error instanceof WsException) {
      return error;
    }

    if (
      error &&
      typeof error === 'object' &&
      'getStatus' in error &&
      typeof error.getStatus === 'function'
    ) {
      const status = error.getStatus();
      const message =
        'message' in error && typeof error.message === 'string'
          ? error.message
          : 'Operación de chat rechazada';

      return new WsException({ status, message });
    }

    return new WsException('No se pudo completar la operación de chat');
  }

  private obtenerTokenDeHandshake(auth: unknown): string | undefined {
    if (
      !auth ||
      typeof auth !== 'object' ||
      !('token' in auth) ||
      typeof auth.token !== 'string'
    ) {
      return undefined;
    }

    const valor = auth.token.trim();
    if (!valor) {
      return undefined;
    }

    const coincidencia = /^Bearer\s+(\S+)$/i.exec(valor);
    return coincidencia ? coincidencia[1] : valor;
  }

  private obtenerCookie(
    encabezado: string | undefined,
    nombre: string,
  ): string | undefined {
    if (!encabezado) {
      return undefined;
    }

    for (const parte of encabezado.split(';')) {
      const separador = parte.indexOf('=');
      if (separador < 0) {
        continue;
      }

      const clave = parte.slice(0, separador).trim();
      if (clave !== nombre) {
        continue;
      }

      return decodeURIComponent(parte.slice(separador + 1).trim());
    }

    return undefined;
  }
}
