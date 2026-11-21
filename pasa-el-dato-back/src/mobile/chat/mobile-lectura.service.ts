import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatService } from '../../chat/chat.service.js';
import { Conversation } from '../../chat/schemas/conversation.schema.js';
import { Mensaje } from '../../chat/schemas/mensaje.schema.js';

@Injectable()
export class MobileLecturaService {
  constructor(
    private readonly chatService: ChatService,
    @InjectModel(Conversation.name) private readonly conversaciones: Model<Conversation>,
    @InjectModel(Mensaje.name) private readonly mensajes: Model<Mensaje>,
  ) {}

  async confirmar(entrada: { cuentaId: string; conversacionId: string; mensajeId: string }) {
    const conversacion = await this.chatService.asegurarParticipante(entrada);
    if (!/^[a-f\d]{24}$/i.test(entrada.mensajeId)) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    const mensajeId = new Types.ObjectId(entrada.mensajeId);
    const mensaje = await this.mensajes.exists({
      _id: mensajeId,
      conversacionId: conversacion._id,
      emisorCuentaId: { $ne: entrada.cuentaId },
    });
    if (!mensaje) throw new NotFoundException('Mensaje no encontrado');

    const campo = conversacion.vendedorCuentaId === entrada.cuentaId
      ? 'leidoHastaMensajeIdVendedor'
      : 'leidoHastaMensajeIdComprador';
    const actualizada = await this.conversaciones.findOneAndUpdate(
      {
        _id: conversacion._id,
        $or: [
          { vendedorCuentaId: entrada.cuentaId },
          { compradorCuentaId: entrada.cuentaId },
        ],
      },
      { $max: { [campo]: mensajeId } },
      { returnDocument: 'after', timestamps: false },
    ).lean().exec();
    if (!actualizada) throw new NotFoundException('Conversación no encontrada');

    return {
      conversacionId: String(conversacion._id),
      leidoHastaMensajeId: actualizada[campo] ? String(actualizada[campo]) : null,
    };
  }
}
