import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

function obtenerCookie(
  encabezado: string | string[] | undefined,
  nombre: string,
): string | undefined {
  const cookies = Array.isArray(encabezado)
    ? encabezado
    : encabezado
      ? [encabezado]
      : [];
  return cookies.find((cookie) => cookie.startsWith(`${nombre}=`))?.split(';')[0];
}

function esperarEvento<T>(
  socket: Socket,
  evento: string,
  timeoutMs = 3_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout esperando evento ${evento}`));
    }, timeoutMs);

    socket.once(evento, (payload: T) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

describe('Chat Gateway - mensajería tiempo real (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;

  const contrasena = 'clave-temporal-chat-gw';
  const correoVendedor = `chat.gw.e2e.vendedor.${randomUUID()}@duocuc.cl`;
  const correoComprador = `chat.gw.e2e.comprador.${randomUUID()}@duocuc.cl`;
  const correoTercero = `chat.gw.e2e.tercero.${randomUUID()}@duocuc.cl`;

  let idCuentaVendedor: string;
  let idCuentaComprador: string;

  let cookieComprador: string;
  let cookieTercero: string;

  let conversacionId: string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = modulo.get(PrismaService);

    // Vitest usa un server HTTP real (mismo patrón de otros e2e).
    const server: unknown = app.getHttpServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = (server as any).listen ? (server as any).address?.() : null;
    // Si el server aún no está escuchando, supertest igual funciona; para socket.io
    // necesitamos un puerto. En Nest testing, getHttpServer() expone el server
    // ya escuchando internamente con supertest, pero no siempre entrega address.
    // Usamos el PORT del contenedor como base del API.
    baseUrl = `http://localhost:${process.env.API_PORT ?? '3001'}`;

    const [sede, carrera, categoria, tipoVenta] = await Promise.all([
      prisma.sede.findFirst({
        where: { activa: true, eliminado: false },
        select: { id: true },
      }),
      prisma.carrera.findFirst({ select: { id: true } }),
      prisma.categoria.findFirst({ select: { id: true } }),
      prisma.tipoVenta.findFirst({ select: { id: true } }),
    ]);

    if (!sede || !carrera || !categoria || !tipoVenta) {
      throw new Error(
        'La prueba requiere catálogos seed (sede/carrera/categoria/tipoventa)',
      );
    }

    const asegurarEstado = async (descripcion: string): Promise<{ id: number }> => {
      const existente = await prisma.estadoPublicacion.findFirst({
        where: { descripcion },
        select: { id: true },
      });
      if (existente) return existente;

      const creado = await prisma.estadoPublicacion.create({
        data: { descripcion },
        select: { id: true },
      });
      return creado;
    };

    const estadoEnCurso = await asegurarEstado('En curso');

    const registrarUsuario = async (correo: string): Promise<string> => {
      await request(app.getHttpServer())
        .post('/api/usuario/registro')
        .send({
          correo,
          run: `${Date.now()}${randomInt(100000, 999999)}-1`,
          telefono: '12345678',
          contrasena,
          pNombre: 'Prueba',
          pApellido: 'E2E',
          sApellido: 'Chat',
          sedeId: sede.id,
          carreraId: carrera.id,
        })
        .expect(201);

      const cuenta = await prisma.cuenta.findUniqueOrThrow({
        where: { correo },
        select: { id_cuenta: true },
      });

      return cuenta.id_cuenta;
    };

    [idCuentaVendedor, idCuentaComprador] = await Promise.all([
      registrarUsuario(correoVendedor),
      registrarUsuario(correoComprador),
      registrarUsuario(correoTercero),
    ]);

    const login = async (correo: string): Promise<string> => {
      const respuesta = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ correo, contrasena })
        .expect(200);

      const access = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
      if (!access) throw new Error('login sin accessToken');
      return access;
    };

    [cookieComprador, cookieTercero] = await Promise.all([
      login(correoComprador),
      login(correoTercero),
    ]);

    const publicacionId = (
      await prisma.publicacion.create({
        data: {
          titulo: 'Publicación chat gateway e2e',
          descripcion: 'desc',
          precio: 1000,
          fk_estado_publicacion: estadoEnCurso.id,
          fk_tipoventa: tipoVenta.id,
          fk_categoria: categoria.id,
          fk_usuario: idCuentaVendedor,
          fk_sede: sede.id,
        },
        select: { id: true },
      })
    ).id;

    const conversacion = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId })
      .expect(201);

    conversacionId = conversacion.body.conversacionId;
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.publicacion.deleteMany({
        where: { titulo: 'Publicación chat gateway e2e' },
      });
      await prisma.cuenta.deleteMany({
        where: { correo: { in: [correoVendedor, correoComprador, correoTercero] } },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('rechaza conexión WS sin cookie accessToken', async () => {
    const socket = io(`${baseUrl}/chat`, {
      transports: ['websocket'],
      autoConnect: false,
    });

    const desconectado = esperarEvento(socket, 'disconnect', 3_000);
    socket.connect();

    await expect(desconectado).resolves.toBeDefined();
    socket.close();
  }, 15_000);

  it('permite join a participante y sincroniza', async () => {
    const socket = io(`${baseUrl}/chat`, {
      transports: ['websocket'],
      extraHeaders: { Cookie: cookieComprador },
    });

    await esperarEvento(socket, 'connect', 5_000);

    const sync = await socket.emitWithAck('chat:join_conversacion', {
      conversacionId,
      limit: 2,
    });

    expect(sync).toHaveProperty('conversacionId', conversacionId);
    expect(sync).toHaveProperty('items');
    socket.close();
  }, 20_000);

  it('rechaza join si no participa', async () => {
    const socket = io(`${baseUrl}/chat`, {
      transports: ['websocket'],
      extraHeaders: { Cookie: cookieTercero },
    });

    await esperarEvento(socket, 'connect', 5_000);

    const respuesta = await socket.emitWithAck('chat:join_conversacion', {
      conversacionId,
      limit: 2,
    });

    expect(respuesta).toHaveProperty('message');
    socket.close();
  }, 20_000);

  it('persiste y emite chat:mensaje_nuevo a la room', async () => {
    const receptor = io(`${baseUrl}/chat`, {
      transports: ['websocket'],
      extraHeaders: { Cookie: cookieComprador },
    });

    await esperarEvento(receptor, 'connect', 5_000);
    await receptor.emitWithAck('chat:join_conversacion', { conversacionId });

    const recibido = esperarEvento<{
      id: string;
      conversacionId: string;
      emisorCuentaId: string;
      texto: string;
    }>(receptor, 'chat:mensaje_nuevo', 5_000);

    const emisor = io(`${baseUrl}/chat`, {
      transports: ['websocket'],
      extraHeaders: { Cookie: cookieComprador },
    });

    await esperarEvento(emisor, 'connect', 5_000);
    await emisor.emitWithAck('chat:join_conversacion', { conversacionId });

    const ack = await emisor.emitWithAck('chat:enviar_mensaje', {
      conversacionId,
      texto: 'hola-ws',
    });

    expect(ack).toHaveProperty('id');
    expect(ack).toHaveProperty('texto', 'hola-ws');

    const evento = await recibido;
    expect(evento.texto).toBe('hola-ws');
    expect(evento.conversacionId).toBe(conversacionId);

    emisor.close();
    receptor.close();
  }, 30_000);
});
