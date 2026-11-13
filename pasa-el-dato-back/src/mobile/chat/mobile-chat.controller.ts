import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  JwtAuthGuard,
  type SesionAutenticada,
} from '../../auth/jwt-auth.guard.js';
import { ChatGateway } from '../../chat/chat.gateway.js';
import { ChatService } from '../../chat/chat.service.js';
import { EnviarMensajeMobileDto } from './dto/enviar-mensaje-mobile.dto.js';
import { IniciarConversacionMobileDto } from './dto/iniciar-conversacion-mobile.dto.js';
import { MobileChatService } from './mobile-chat.service.js';

type SolicitudAutenticada = Request & { user?: SesionAutenticada };

@Controller('mobile/chat')
@UseGuards(JwtAuthGuard)
export class MobileChatController {
  constructor(
    private readonly mobileChatService: MobileChatService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversaciones')
  async listarConversaciones(
    @Req() solicitud: SolicitudAutenticada,
    @Query('cursor') cursor?: string,
    @Query('limit') limitTexto?: string,
  ) {
    return this.mobileChatService.listarConversaciones({
      cuentaId: this.obtenerCuenta(solicitud),
      cursor,
      limit: this.normalizarLimit(limitTexto),
    });
  }

  @Post('conversaciones/iniciar-con-mensaje')
  @HttpCode(HttpStatus.CREATED)
  async iniciarConversacionConMensaje(
    @Req() solicitud: SolicitudAutenticada,
    @Body() dto: IniciarConversacionMobileDto,
  ) {
    const resultado =
      await this.mobileChatService.iniciarConversacionConMensaje({
        publicacionId: dto.publicacionId,
        cuentaId: this.obtenerCuenta(solicitud),
        texto: dto.texto,
      });

    this.chatGateway.emitirMensajeNuevo(resultado.mensaje);

    return {
      conversacionId: resultado.conversacionId,
      creada: resultado.creada,
      mensaje: this.mapearMensaje(resultado.mensaje),
    };
  }

  @Post('conversaciones/:id/mensajes')
  @HttpCode(HttpStatus.CREATED)
  async enviarMensaje(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') conversacionId: string,
    @Body() dto: EnviarMensajeMobileDto,
  ) {
    const mensaje = await this.chatService.enviarMensaje({
      conversacionId,
      cuentaId: this.obtenerCuenta(solicitud),
      texto: dto.texto,
    });

    this.chatGateway.emitirMensajeNuevo(mensaje);
    return this.mapearMensaje(mensaje);
  }

  @Get('conversaciones/:id/mensajes')
  async listarMensajes(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') conversacionId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitTexto?: string,
  ) {
    const resultado = await this.chatService.listarMensajesPaginados({
      conversacionId,
      cuentaId: this.obtenerCuenta(solicitud),
      cursor,
      limit: this.normalizarLimit(limitTexto),
    });

    return {
      items: resultado.items.map((mensaje) => this.mapearMensaje(mensaje)),
      nextCursor: resultado.nextCursor,
    };
  }

  @Post('conversaciones/:id/leer')
  @HttpCode(HttpStatus.OK)
  async marcarComoLeida(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') conversacionId: string,
  ) {
    return this.chatService.marcarConversacionComoLeida({
      conversacionId,
      cuentaId: this.obtenerCuenta(solicitud),
    });
  }

  private obtenerCuenta(solicitud: SolicitudAutenticada): string {
    return solicitud.user!.idCuenta;
  }

  private normalizarLimit(limitTexto?: string): number {
    const limit = Number(limitTexto);
    return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 50) : 20;
  }

  private mapearMensaje(mensaje: {
    _id: unknown;
    conversacionId: unknown;
    emisorCuentaId: string;
    texto: string;
    enviadoEn: Date;
    leido?: boolean;
    leidoPorContraparte?: boolean;
  }) {
    return {
      id: String(mensaje._id),
      conversacionId: String(mensaje.conversacionId),
      emisorCuentaId: mensaje.emisorCuentaId,
      texto: mensaje.texto,
      enviadoEn: mensaje.enviadoEn,
      leido: mensaje.leido,
      leidoPorContraparte: mensaje.leidoPorContraparte,
    };
  }
}
