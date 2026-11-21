import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createConnection, Types, type Connection, type Model } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Conversation, ConversationSchema } from '../../chat/schemas/conversation.schema.js';
import { Mensaje, MensajeSchema } from '../../chat/schemas/mensaje.schema.js';
import { MobileLecturaService } from './mobile-lectura.service.js';
import { MobileNoLeidosService } from './mobile-no-leidos.service.js';

const url = process.env.MOBILE_LECTURA_TEST_MONGO_URL;
const suite = url ? describe : describe.skip;

suite('lectura mobile con MongoDB aislado', () => {
  let conexion: Connection;
  let conversaciones: Model<Conversation>;
  let mensajes: Model<Mensaje>;
  let lectura: MobileLecturaService;
  let noLeidos: MobileNoLeidosService;

  beforeAll(async () => {
    const destino = new URL(url!);
    if (destino.hostname !== '127.0.0.1' || destino.port !== '27832' ||
        destino.pathname !== '/mobile_lectura_test') {
      throw new Error('La prueba requiere la instancia MongoDB temporal aislada.');
    }
    conexion = await createConnection(url!, { autoIndex: false }).asPromise();
    conversaciones = conexion.model(Conversation.name, ConversationSchema);
    mensajes = conexion.model(Mensaje.name, MensajeSchema);
    lectura = new MobileLecturaService(
      {
        asegurarParticipante: async ({ cuentaId, conversacionId }: { cuentaId: string; conversacionId: string }) => {
          const conversacion = await conversaciones.findById(conversacionId);
          if (!conversacion) throw new NotFoundException();
          if (conversacion.vendedorCuentaId !== cuentaId && conversacion.compradorCuentaId !== cuentaId) {
            throw new ForbiddenException();
          }
          return conversacion;
        },
      } as never,
      conversaciones,
      mensajes,
    );
    noLeidos = new MobileNoLeidosService(conversaciones);
  });

  afterAll(async () => {
    if (conexion) await conexion.close();
  });

  it('confirma solo mensajes existentes de la contraparte y nunca retrocede', async () => {
    const conversacion = await conversaciones.create({
      publicacionId: new Types.ObjectId().toString(),
      vendedorCuentaId: 'vendedor',
      compradorCuentaId: 'comprador',
      estadoPublicacionAlCrear: 'En curso',
    });
    const ids = Array.from({ length: 4 }, () => new Types.ObjectId());
    await mensajes.insertMany(ids.map((_id, indice) => ({
      _id,
      conversacionId: conversacion._id,
      emisorCuentaId: indice === 3 ? 'vendedor' : 'comprador',
      texto: 'Mensaje de prueba',
    })));
    const entrada = { cuentaId: 'vendedor', conversacionId: String(conversacion._id) };
    expect(await noLeidos.contar('vendedor')).toBe(3);
    await lectura.confirmar({ ...entrada, mensajeId: String(ids[0]) });
    expect(await noLeidos.contar('vendedor')).toBe(2);

    await Promise.all([
      lectura.confirmar({ ...entrada, mensajeId: String(ids[2]) }),
      lectura.confirmar({ ...entrada, mensajeId: String(ids[1]) }),
      lectura.confirmar({ ...entrada, mensajeId: String(ids[0]) }),
    ]);
    const guardada = await conversaciones.findById(conversacion._id).lean();
    expect(String(guardada?.leidoHastaMensajeIdVendedor)).toBe(String(ids[2]));
    expect(await noLeidos.contar('vendedor')).toBe(0);

    await expect(lectura.confirmar({ ...entrada, mensajeId: String(ids[3]) }))
      .rejects.toBeInstanceOf(NotFoundException);
    await expect(lectura.confirmar({ ...entrada, mensajeId: String(new Types.ObjectId()) }))
      .rejects.toBeInstanceOf(NotFoundException);
    await expect(lectura.confirmar({ ...entrada, cuentaId: 'tercero', mensajeId: String(ids[0]) }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});
