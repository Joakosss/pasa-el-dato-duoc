import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Conversation,
  type ConversationDocument,
} from './schemas/conversation.schema.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
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
}
