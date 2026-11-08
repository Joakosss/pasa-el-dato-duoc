import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module.js';
import { ChatService } from '../src/chat/chat.service.js';
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

    socket.once('connect_error', (error: unknown) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function emitirConAck<T = unknown>(
  socket: Socket,
  evento: string,
  payload: unknown,
  timeoutMs = 5_000,
): Promise<T> {
  return await socket.timeout(timeoutMs).emitWithAck(evento, payload);
}

describe('Chat Gateway - lectura (HU-CHAT-04) (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let chatService: ChatService;
  let baseUrl: string;

  const contrasena = 'clave-temporal-chat-lectura-gw';
  // Mantener el local-part simple: el validador Duoc puede rechazar formatos con muchos puntos.
  const correoVendedor = `vendedor-${randomUUID()}@duocuc.cl`;
  const correoComprador = `comprador-${randomUUID()}@duocuc.cl`;

  let cookieVendedor: string;
  let cookieComprador: string;

  let idCuentaVendedor: string;
  let publicacionId: string;
  let conversacionId: string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    // Para Socket.IO necesitamos un server realmente escuchando.
    await app.init();
    await app.listen(0);

    prisma = modulo.get(PrismaService);
    chatService = modulo.get(ChatService);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const address = (app.getHttpServer() as any).address?.();
    const puerto = address && typeof address === 'object' ? address.port : undefined;
    if (typeof puerto !== 'number') {
      throw new Error('No se pudo resolver el puerto del servidor de pruebas');
    }

    baseUrl = `http://127.0.0.1:${puerto}`;

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
      const run = `${Date.now()}${randomInt(100000, 999999)}-${randomInt(0, 9)}`;

      const respuesta = await request(app.getHttpServer())
        .post('/api/usuario/registro')
        .send({
          correo,
          run,
          telefono: '12345678',
          contrasena,
          pNombre: 'Prueba',
          pApellido: 'E2E',
          sApellido: 'Chat',
          sedeId: sede.id,
          carreraId: carrera.id,
        });

      if (respuesta.status !== 201) {
        throw new Error(
          `No se pudo registrar usuario (${respuesta.status}): ${JSON.stringify(
            respuesta.body,
          )}`,
        );
      }

      const cuenta = await prisma.cuenta.findUniqueOrThrow({
        where: { correo },
        select: { id_cuenta: true },
      });

      return cuenta.id_cuenta;
    };

    [idCuentaVendedor] = await Promise.all([
      registrarUsuario(correoVendedor),
      registrarUsuario(correoComprador),
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

    [cookieVendedor, cookieComprador] = await Promise.all([
      login(correoVendedor),
      login(correoComprador),
    ]);

    publicacionId = (
      await prisma.publicacion.create({
        data: {
          titulo: 'Publicación chat lectura gateway e2e',
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
        where: { titulo: 'Publicación chat lectura gateway e2e' },
      });

      await prisma.cuenta.deleteMany({
        where: { correo: { in: [correoVendedor, correoComprador] } },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('marca como leída vía WS (chat:conversacionAbierta) y baja noLeidosCount', async () => {
    const cuentaComprador = await prisma.cuenta.findUniqueOrThrow({
      where: { correo: correoComprador },
      select: { id_cuenta: true },
    });

    // Sembrar mensajes desde comprador (id real).
    for (let i = 0; i < 5; i += 1) {
      await chatService.enviarMensaje({
        conversacionId,
        cuentaId: cuentaComprador.id_cuenta,
        texto: `m${i + 1}`,
      });
    }

    const antes = await request(app.getHttpServer())
      .get('/api/chat/conversaciones')
      .set('Cookie', cookieVendedor)
      .expect(200);

    const conversacionAntes = antes.body.items.find(
      (item: { conversacionId: string }) => item.conversacionId === conversacionId,
    );

    expect(conversacionAntes).toBeDefined();
    expect(conversacionAntes.noLeidosCount).toBe(5);

    const socket = io(`${baseUrl}/chat`, {
      transports: ['polling'],
      transportOptions: {
        polling: {
          extraHeaders: { Cookie: cookieVendedor },
        },
      },
    });

    await esperarEvento(socket, 'connect', 5_000);

    const ack = await emitirConAck<{
      conversacionId: string;
      leidoHastaMensajeId: string | null;
    }>(
      socket,
      'chat:conversacionAbierta',
      { conversacionId },
      10_000,
    );

    expect(ack.conversacionId).toBe(conversacionId);
    expect(
      ack.leidoHastaMensajeId === null || typeof ack.leidoHastaMensajeId === 'string',
    ).toBe(true);

    socket.close();

    const despues = await request(app.getHttpServer())
      .get('/api/chat/conversaciones')
      .set('Cookie', cookieVendedor)
      .expect(200);

    const conversacionDespues = despues.body.items.find(
      (item: { conversacionId: string }) => item.conversacionId === conversacionId,
    );

    expect(conversacionDespues).toBeDefined();
    expect(conversacionDespues.noLeidosCount).toBe(0);
  }, 30_000);
});
