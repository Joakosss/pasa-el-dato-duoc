import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChatGateway } from '../../chat/chat.gateway.js';
import { ChatService } from '../../chat/chat.service.js';

@Injectable()
export class MobileChatService {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async iniciarConversacionConMensaje(entrada: {
    publicacionId: string;
    cuentaId: string;
    texto: string;
  }) {
    const conversacion = await this.chatService.iniciarConversacion({
      publicacionId: entrada.publicacionId,
      idCuentaSolicitante: entrada.cuentaId,
    });

    const mensaje = await this.chatService.enviarMensaje({
      conversacionId: conversacion.conversacionId,
      cuentaId: entrada.cuentaId,
      texto: entrada.texto,
    });

    return { ...conversacion, mensaje };
  }

  async obtenerConversacion(entrada: { cuentaId: string; conversacionId: string }) {
    const conversacion = await this.chatService.asegurarParticipante(entrada);
    const esVendedor = conversacion.vendedorCuentaId === entrada.cuentaId;
    const contraparteCuentaId = esVendedor
      ? conversacion.compradorCuentaId
      : conversacion.vendedorCuentaId;
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_cuenta: contraparteCuentaId },
      select: { pNombre: true, pApellido: true },
    });

    return {
      conversacionId: String(conversacion._id),
      publicacionId: conversacion.publicacionId,
      rolEnTransaccion: esVendedor ? 'vendedor' as const : 'comprador' as const,
      contraparteCuentaId,
      contraparte: {
        primerNombre: usuario?.pNombre ?? 'Usuario',
        primerApellido: usuario?.pApellido ?? '',
        enLinea: this.chatGateway.estaEnLinea(contraparteCuentaId),
      },
    };
  }

  async listarConversaciones(entrada: {
    cuentaId: string;
    cursor?: string;
    limit: number;
  }) {
    const resultado = await this.chatService.listarConversacionesPaginadas(entrada);
    const conMensajes = resultado.items.filter(
      (conversacion) => conversacion.ultimoMensaje !== null,
    );

    const contraparteIds = Array.from(
      new Set(conMensajes.map((conversacion) => conversacion.contraparteCuentaId)),
    );
    const usuarios = await this.prisma.usuario.findMany({
      where: { id_cuenta: { in: contraparteIds } },
      select: { id_cuenta: true, pNombre: true, pApellido: true },
    });
    const nombres = new Map(
      usuarios.map((usuario) => [
        usuario.id_cuenta,
        { primerNombre: usuario.pNombre, primerApellido: usuario.pApellido },
      ]),
    );

    return {
      items: conMensajes.map((conversacion) => ({
        ...conversacion,
        publicacionId: conversacion.publicacion.id,
        rolEnTransaccion: conversacion.rolEnTransaccion,
        contraparte: {
          ...(nombres.get(conversacion.contraparteCuentaId) ?? {
            primerNombre: 'Usuario',
            primerApellido: '',
          }),
          enLinea: this.chatGateway.estaEnLinea(
            conversacion.contraparteCuentaId,
          ),
        },
      })),
      nextCursor: resultado.nextCursor,
    };
  }
}
