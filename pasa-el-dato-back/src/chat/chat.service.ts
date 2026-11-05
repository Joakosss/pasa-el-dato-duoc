import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Conversation,
  type ConversationDocument,
} from './schemas/conversation.schema.js';
import { Mensaje, type MensajeDocument } from './schemas/mensaje.schema.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Mensaje.name)
    private readonly mensajeModel: Model<MensajeDocument>,
  ) {}

  async iniciarConversacion(entrada: {
    publicacionId: string;
    idCuentaSolicitante: string;
  }): Promise<{ conversacionId: string; creada: boolean }> {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: entrada.publicacionId },
      select: {
        id: true,
        eliminado: true,
        fk_usuario: true,
        estadoPublicacion: { select: { descripcion: true } },
      },
    });

    if (publicacion === null || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Dueño no puede contactarse.
    if (publicacion.fk_usuario === entrada.idCuentaSolicitante) {
      throw new ForbiddenException('No puede contactarse consigo mismo');
    }

    const estado = publicacion.estadoPublicacion.descripcion;

    // Regla HU-CHAT-01: rechazado en Pausada.
    if (estado === 'Pausada') {
      throw new BadRequestException('Publicación no disponible para contacto');
    }

    // Solo se permite iniciar en "En curso" o "Vendida".
    if (estado !== 'En curso' && estado !== 'Vendida') {
      throw new BadRequestException('Publicación no disponible para contacto');
    }

    const vendedorCuentaId = publicacion.fk_usuario;
    const compradorCuentaId = entrada.idCuentaSolicitante;

    // Regla: única conversación por par usuarios + publicación.
    // Upsert por índice único (findOneAndUpdate + $setOnInsert).
    const antes = await this.conversationModel.findOne(
      {
        publicacionId: publicacion.id,
        vendedorCuentaId,
        compradorCuentaId,
      },
      { _id: 1 },
    );

    if (antes) {
      return { conversacionId: String(antes._id), creada: false };
    }

    const creada = await this.conversationModel.findOneAndUpdate(
      {
        publicacionId: publicacion.id,
        vendedorCuentaId,
        compradorCuentaId,
      },
      {
        $setOnInsert: {
          publicacionId: publicacion.id,
          vendedorCuentaId,
          compradorCuentaId,
          estadoPublicacionAlCrear: estado,
          ultimoMensajeEn: null,
        },
      },
      { upsert: true, new: true },
    );

    return { conversacionId: String(creada._id), creada: true };
  }

  async asegurarParticipante(entrada: {
    conversacionId: string;
    cuentaId: string;
  }): Promise<ConversationDocument> {
    if (!isValidObjectId(entrada.conversacionId)) {
      throw new NotFoundException('Conversación no encontrada');
    }

    const conversacion = await this.conversationModel.findById(
      entrada.conversacionId,
    );

    if (!conversacion) {
      throw new NotFoundException('Conversación no encontrada');
    }

    if (
      conversacion.vendedorCuentaId !== entrada.cuentaId &&
      conversacion.compradorCuentaId !== entrada.cuentaId
    ) {
      throw new ForbiddenException('No participa en esta conversación');
    }

    return conversacion;
  }

  async listarMensajesPaginados(entrada: {
    conversacionId: string;
    cuentaId: string;
    cursor?: string;
    limit: number;
  }): Promise<{ items: MensajeDocument[]; nextCursor: string | null }> {
    const conversacion = await this.asegurarParticipante({
      conversacionId: entrada.conversacionId,
      cuentaId: entrada.cuentaId,
    });

    const filtro: Record<string, unknown> = {
      conversacionId: new Types.ObjectId(conversacion._id),
    };

    if (entrada.cursor) {
      if (!isValidObjectId(entrada.cursor)) {
        throw new BadRequestException('Cursor inválido');
      }
      filtro._id = { $lt: new Types.ObjectId(entrada.cursor) };
    }

    const docs = await this.mensajeModel
      .find(filtro)
      .sort({ _id: -1 })
      .limit(entrada.limit);

    const nextCursor = docs.length > 0 ? String(docs[docs.length - 1]._id) : null;

    return { items: docs, nextCursor };
  }

  async enviarMensaje(entrada: {
    conversacionId: string;
    cuentaId: string;
    texto: string;
  }): Promise<MensajeDocument> {
    const texto = entrada.texto.trim();

    if (!texto) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    if (texto.length > 2000) {
      throw new BadRequestException(
        'El mensaje no puede superar los 2000 caracteres',
      );
    }

    const conversacion = await this.asegurarParticipante({
      conversacionId: entrada.conversacionId,
      cuentaId: entrada.cuentaId,
    });

    const mensaje = await this.mensajeModel.create({
      conversacionId: conversacion._id,
      emisorCuentaId: entrada.cuentaId,
      texto,
      enviadoEn: new Date(),
    });

    await this.conversationModel.updateOne(
      { _id: conversacion._id },
      { $set: { ultimoMensajeEn: mensaje.enviadoEn } },
    );

    return mensaje;
  }
}
