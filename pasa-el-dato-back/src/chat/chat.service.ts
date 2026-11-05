import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { isValidObjectId, Types } from 'mongoose';
import { decodeCursor, encodeCursor } from '../common/pagination/cursor.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Conversation,
  type ConversationDocument,
} from './schemas/conversation.schema.js';
import { Mensaje, type MensajeDocument } from './schemas/mensaje.schema.js';

type CursorConversaciones = {
  actividadEn: string;
  id: string;
};

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

  async listarConversacionesPaginadas(entrada: {
    cuentaId: string;
    cursor?: string;
    limit: number;
  }): Promise<{
    items: Array<{
      conversacionId: string;
      contraparteCuentaId: string;
      publicacion: { id: string; estado: 'VISIBLE' | 'NO_DISPONIBLE'; titulo?: string };
      ultimoMensaje: null | { texto: string; enviadoEn: Date; emisorCuentaId: string };
      actividadEn: Date;
    }>;
    nextCursor: string | null;
  }> {
    const limit = Math.min(Math.max(entrada.limit, 1), 50);

    let decoded: CursorConversaciones | null = null;
    if (entrada.cursor) {
      try {
        decoded = decodeCursor<CursorConversaciones>(entrada.cursor);
      } catch {
        throw new BadRequestException('Cursor inválido');
      }
    }

    const filter: Record<string, unknown> = {
      $or: [
        { vendedorCuentaId: entrada.cuentaId },
        { compradorCuentaId: entrada.cuentaId },
      ],
    };

    // Paginación estable por (actividadEn desc, _id desc)
    if (decoded) {
      const actividadDate = new Date(decoded.actividadEn);
      if (Number.isNaN(actividadDate.getTime()) || !isValidObjectId(decoded.id)) {
        throw new BadRequestException('Cursor inválido');
      }

      filter.$and = [
        {
          $or: [
            { ultimoMensajeEn: { $lt: actividadDate } },
            { ultimoMensajeEn: actividadDate, _id: { $lt: new Types.ObjectId(decoded.id) } },
            // conversaciones sin mensajes -> caen por creadaEn, se manejan por pipeline abajo
          ],
        },
      ];
    }

    // Pipeline para:
    // - calcular actividadEn = ultimoMensajeEn || creadaEn
    // - ordenar y paginar
    const pipeline: Record<string, unknown>[] = [
      { $match: filter },
      {
        $addFields: {
          actividadEn: { $ifNull: ['$ultimoMensajeEn', '$creadaEn'] },
        },
      },
      { $sort: { actividadEn: -1, _id: -1 } },
      { $limit: limit + 1 },
      {
        $project: {
          _id: 1,
          publicacionId: 1,
          vendedorCuentaId: 1,
          compradorCuentaId: 1,
          actividadEn: 1,
          ultimoMensajeEn: 1,
        },
      },
    ];

    const docs = (await this.conversationModel.aggregate(pipeline)) as Array<{
      _id: Types.ObjectId;
      publicacionId: string;
      vendedorCuentaId: string;
      compradorCuentaId: string;
      actividadEn: Date;
      ultimoMensajeEn: Date | null;
    }>;

    const page = docs.slice(0, limit);
    const hasMore = docs.length > limit;

    const publicacionIds = Array.from(new Set(page.map((x) => x.publicacionId)));

    const publicaciones = await this.prisma.publicacion.findMany({
      where: { id: { in: publicacionIds } },
      select: {
        id: true,
        eliminado: true,
        titulo: true,
      },
    });

    const publicacionesPorId = new Map(
      publicaciones.map((p) => [
        p.id,
        {
          id: p.id,
          estado: p.eliminado ? ('NO_DISPONIBLE' as const) : ('VISIBLE' as const),
          titulo: p.eliminado ? undefined : p.titulo,
        },
      ]),
    );

    // Traer último mensaje solo para las conversaciones que tienen ultimoMensajeEn,
    // resolviendo por consulta al índice (conversacionId + _id desc)
    const ultimos = await this.mensajeModel
      .find({
        conversacionId: { $in: page.map((x) => x._id) },
      })
      .sort({ conversacionId: 1, _id: -1 });

    const ultimoPorConversacion = new Map<string, MensajeDocument>();
    for (const mensaje of ultimos) {
      const key = String(mensaje.conversacionId);
      if (!ultimoPorConversacion.has(key)) {
        ultimoPorConversacion.set(key, mensaje);
      }
    }

    const items = page.map((doc) => {
      const conversacionId = String(doc._id);
      const contraparteCuentaId =
        doc.vendedorCuentaId === entrada.cuentaId
          ? doc.compradorCuentaId
          : doc.vendedorCuentaId;

      const publicacion =
        publicacionesPorId.get(doc.publicacionId) ??
        ({ id: doc.publicacionId, estado: 'NO_DISPONIBLE' as const } as const);

      const ultimoMensajeDoc = ultimoPorConversacion.get(conversacionId);

      return {
        conversacionId,
        contraparteCuentaId,
        publicacion,
        ultimoMensaje: ultimoMensajeDoc
          ? {
              texto: ultimoMensajeDoc.texto,
              enviadoEn: ultimoMensajeDoc.enviadoEn,
              emisorCuentaId: ultimoMensajeDoc.emisorCuentaId,
            }
          : null,
        actividadEn: doc.actividadEn,
      };
    });

    const nextCursor = hasMore
      ? encodeCursor<CursorConversaciones>({
          actividadEn: page[page.length - 1]!.actividadEn.toISOString(),
          id: String(page[page.length - 1]!._id),
        })
      : null;

    return { items, nextCursor };
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
