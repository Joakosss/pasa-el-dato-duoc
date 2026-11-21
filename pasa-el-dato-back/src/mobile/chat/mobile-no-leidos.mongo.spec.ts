import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createConnection, Types, type Connection, type Model } from 'mongoose';
import { Conversation, ConversationSchema } from '../../chat/schemas/conversation.schema.js';
import { MobileNoLeidosService } from './mobile-no-leidos.service.js';

const url = process.env.MOBILE_NO_LEIDOS_TEST_MONGO_URL;
const suite = url ? describe : describe.skip;

suite('contador mobile con MongoDB aislado', () => {
  let conexion: Connection;
  let conversaciones: Model<Conversation>;
  let servicio: MobileNoLeidosService;

  beforeAll(async () => {
    const destino = new URL(url!);
    if (destino.hostname !== '127.0.0.1' || destino.port !== '27831' ||
        destino.pathname !== '/mobile_no_leidos_test') {
      throw new Error('La prueba requiere la instancia MongoDB temporal aislada.');
    }
    conexion = await createConnection(url!, { autoIndex: false }).asPromise();
    conversaciones = conexion.model(Conversation.name, ConversationSchema);
    servicio = new MobileNoLeidosService(conversaciones);
  });

  afterAll(async () => {
    if (conexion) await conexion.close();
  });

  it('cuenta todos los chats, respeta lectura, emisor y cuenta', async () => {
    const chats = Array.from({ length: 25 }, () => ({
      _id: new Types.ObjectId(),
      publicacionId: new Types.ObjectId().toString(),
      vendedorCuentaId: 'cuenta-prueba',
      compradorCuentaId: 'otra-cuenta',
      estadoPublicacionAlCrear: 'En curso',
      leidoHastaMensajeIdVendedor: null,
      leidoHastaMensajeIdComprador: null,
    }));
    const chatComprador = {
      _id: new Types.ObjectId(),
      publicacionId: new Types.ObjectId().toString(),
      vendedorCuentaId: 'vendedor',
      compradorCuentaId: 'cuenta-prueba',
      estadoPublicacionAlCrear: 'En curso',
      leidoHastaMensajeIdVendedor: null,
      leidoHastaMensajeIdComprador: new Types.ObjectId(),
    };
    const ajeno = {
      _id: new Types.ObjectId(),
      publicacionId: new Types.ObjectId().toString(),
      vendedorCuentaId: 'ajeno',
      compradorCuentaId: 'tercero',
      estadoPublicacionAlCrear: 'En curso',
    };
    await conversaciones.collection.insertMany([...chats, chatComprador, ajeno]);
    const mensajes = chats.flatMap((chat) => [
      { _id: new Types.ObjectId(), conversacionId: chat._id, emisorCuentaId: 'otra-cuenta', texto: 'prueba' },
      { _id: new Types.ObjectId(), conversacionId: chat._id, emisorCuentaId: 'cuenta-prueba', texto: 'propio' },
    ]);
    mensajes.push(
      { _id: chatComprador.leidoHastaMensajeIdComprador, conversacionId: chatComprador._id, emisorCuentaId: 'vendedor', texto: 'leído' },
      { _id: new Types.ObjectId(), conversacionId: chatComprador._id, emisorCuentaId: 'vendedor', texto: 'no leído' },
      { _id: new Types.ObjectId(), conversacionId: ajeno._id, emisorCuentaId: 'tercero', texto: 'ajeno' },
    );
    await conexion.collection('mensajes').insertMany(mensajes);

    expect(await servicio.contar('cuenta-prueba')).toBe(26);
    expect(await servicio.contar('cuenta-sin-chats')).toBe(0);
  });
});
