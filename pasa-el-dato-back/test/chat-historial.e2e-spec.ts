import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
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

describe('Chat - historial paginado (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let chatService: ChatService;

  const contrasena = 'clave-temporal-chat-historial';
  // Mantener el local-part simple: el validador Duoc puede rechazar formatos con muchos puntos.
  const correoVendedor = `vendedor-${randomUUID()}@duocuc.cl`;
  const correoComprador = `comprador-${randomUUID()}@duocuc.cl`;
  const correoTercero = `tercero-${randomUUID()}@duocuc.cl`;

  let cookieVendedor: string;
  let cookieComprador: string;
  let cookieTercero: string;

  let idCuentaVendedor: string;
  let idCuentaComprador: string;
  let idCuentaTercero: string;

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
    await app.init();

    prisma = modulo.get(PrismaService);
    chatService = modulo.get(ChatService);

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
      // RUN único por usuario; evita colisiones por ejecuciones concurrentes.
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

    [idCuentaVendedor, idCuentaComprador, idCuentaTercero] = await Promise.all([
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

    [cookieVendedor, cookieComprador, cookieTercero] = await Promise.all([
      login(correoVendedor),
      login(correoComprador),
      login(correoTercero),
    ]);

    publicacionId = (
      await prisma.publicacion.create({
        data: {
          titulo: 'Publicación chat historial e2e',
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

    // Sembrar mensajes como comprador (mismo emisor, suficiente para paginación/persistencia)
    for (let i = 0; i < 5; i += 1) {
      await chatService.enviarMensaje({
        conversacionId,
        cuentaId: idCuentaComprador,
        texto: `m${i + 1}`,
      });
    }
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.publicacion.deleteMany({
        where: { titulo: 'Publicación chat historial e2e' },
      });

      await prisma.cuenta.deleteMany({
        where: {
          correo: { in: [correoVendedor, correoComprador, correoTercero] },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('401 sin sesión', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/chat/conversaciones/${conversacionId}/mensajes?limit=2`)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('403 si no participa en la conversación', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/chat/conversaciones/${conversacionId}/mensajes?limit=2`)
      .set('Cookie', cookieTercero)
      .expect(403);

    expect(respuesta.body.message).toBe('No participa en esta conversación');
  });

  it('pagina por cursor y no duplica mensajes', async () => {
    const primera = await request(app.getHttpServer())
      .get(`/api/chat/conversaciones/${conversacionId}/mensajes?limit=2`)
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(primera.body.items).toHaveLength(2);
    expect(typeof primera.body.nextCursor).toBe('string');

    const segunda = await request(app.getHttpServer())
      .get(
        `/api/chat/conversaciones/${conversacionId}/mensajes?limit=2&cursor=${primera.body.nextCursor}`,
      )
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(segunda.body.items).toHaveLength(2);

    const idsPrimera = new Set<string>(primera.body.items.map((x: { id: string }) => x.id));
    const idsSegunda = new Set<string>(segunda.body.items.map((x: { id: string }) => x.id));

    for (const id of idsSegunda) {
      expect(idsPrimera.has(id)).toBe(false);
    }
  });

  it('400 con cursor inválido', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(
        `/api/chat/conversaciones/${conversacionId}/mensajes?limit=2&cursor=cursor-invalido`,
      )
      .set('Cookie', cookieComprador)
      .expect(400);

    expect(respuesta.body.message).toBe('Cursor inválido');
  });
});
