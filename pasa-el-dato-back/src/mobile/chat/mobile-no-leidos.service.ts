import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation } from '../../chat/schemas/conversation.schema.js';

@Injectable()
export class MobileNoLeidosService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversaciones: Model<Conversation>,
  ) {}

  async contar(cuentaId: string): Promise<number> {
    const resultado = await this.conversaciones.aggregate<{ total: number }>([
      {
        $match: {
          $or: [{ vendedorCuentaId: cuentaId }, { compradorCuentaId: cuentaId }],
        },
      },
      {
        $lookup: {
          from: 'mensajes',
          let: {
            conversacionId: '$_id',
            leidoHasta: {
              $cond: [
                { $eq: ['$vendedorCuentaId', cuentaId] },
                '$leidoHastaMensajeIdVendedor',
                '$leidoHastaMensajeIdComprador',
              ],
            },
          },
          pipeline: [
            {
              $match: {
                emisorCuentaId: { $ne: cuentaId },
                $expr: {
                  $and: [
                    { $eq: ['$conversacionId', '$$conversacionId'] },
                    {
                      $or: [
                        { $eq: [{ $ifNull: ['$$leidoHasta', null] }, null] },
                        { $gt: ['$_id', '$$leidoHasta'] },
                      ],
                    },
                  ],
                },
              },
            },
            { $count: 'total' },
          ],
          as: 'noLeidos',
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $ifNull: [{ $arrayElemAt: ['$noLeidos.total', 0] }, 0] },
          },
        },
      },
    ]);
    return resultado[0]?.total ?? 0;
  }
}
