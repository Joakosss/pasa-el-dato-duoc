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

describe('Chat - listado de conversaciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let chatService: ChatService;

  const contrasena = 'clave-temporal-chat-listado';

  const correoVendedor = `vendedor-${randomUUID()}@duocuc.cl`;
  const correoComprador = `comprador-${randomUUID()}@duocuc.cl`;
  const correoTercero = `tercero-${randomUUID()}@duocuc.cl`;

  let idCuentaVendedor: string;
  let idCuentaComprador: string;
  let idCuentaTercero: string;

  let cookieVendedor: string;
  let cookieComprador: string;
  let cookieTercero: string;

  let publicacionA: string;
  let publicacionB: string;

  let conversacionA: string;
  let conversacionB: string;
  let conversacionTerceros: string;

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

    // Publicaciones del vendedor (dos conversaciones del comprador)
    [publicacionA, publicacionB] = await Promise.all([
      prisma.publicacion
        .create({
          data: {
            titulo: 'Publicación chat listado A e2e',
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
        .then((x) => x.id),
      prisma.publicacion
        .create({
          data: {
            titulo: 'Publicación chat listado B e2e',
            descripcion: 'desc',
            precio: 2000,
            fk_estado_publicacion: estadoEnCurso.id,
            fk_tipoventa: tipoVenta.id,
            fk_categoria: categoria.id,
            fk_usuario: idCuentaVendedor,
            fk_sede: sede.id,
          },
          select: { id: true },
        })
        .then((x) => x.id),
    ]);

    // Conversación A (comprador -> vendedor)
    const resA = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId: publicacionA })
      .expect(201);
    conversacionA = resA.body.conversacionId;

    // Conversación B (comprador -> vendedor)
    const resB = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId: publicacionB })
      .expect(201);
    conversacionB = resB.body.conversacionId;

    // Conversación de terceros (no debería aparecer en el listado del comprador)
    const pubTerceros = await prisma.publicacion.create({
      data: {
        titulo: 'Publicación chat listado terceros e2e',
        descripcion: 'desc',
        precio: 3000,
        fk_estado_publicacion: estadoEnCurso.id,
        fk_tipoventa: tipoVenta.id,
        fk_categoria: categoria.id,
        fk_usuario: idCuentaTercero,
        fk_sede: sede.id,
      },
      select: { id: true },
    });

    const resT = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieVendedor)
      .send({ publicacionId: pubTerceros.id })
      .expect(201);
    conversacionTerceros = resT.body.conversacionId;

    // Actividad: conversaciónB será la más reciente.
    await chatService.enviarMensaje({
      conversacionId: conversacionA,
      cuentaId: idCuentaComprador,
      texto: 'msg-a',
    });

    await new Promise((r) => setTimeout(r, 20));

    await chatService.enviarMensaje({
      conversacionId: conversacionB,
      cuentaId: idCuentaComprador,
      texto: 'msg-b',
    });
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.publicacion.deleteMany({
        where: {
          titulo: {
            in: [
              'Publicación chat listado A e2e',
              'Publicación chat listado B e2e',
              'Publicación chat listado terceros e2e',
            ],
          },
        },
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
      .get('/api/chat/conversaciones?limit=2')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('lista solo conversaciones propias', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/chat/conversaciones?limit=10')
      .set('Cookie', cookieComprador)
      .expect(200);

    const ids = respuesta.body.items.map((x: { conversacionId: string }) => x.conversacionId);

    expect(ids).toContain(conversacionA);
    expect(ids).toContain(conversacionB);
    expect(ids).not.toContain(conversacionTerceros);
  });

  it('ordena por actividad reciente (último mensaje)', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/chat/conversaciones?limit=10')
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(respuesta.body.items[0].conversacionId).toBe(conversacionB);
    expect(respuesta.body.items[1].conversacionId).toBe(conversacionA);
  });

  it('paginación por cursor (sin duplicar)', async () => {
    const primera = await request(app.getHttpServer())
      .get('/api/chat/conversaciones?limit=1')
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(primera.body.items).toHaveLength(1);
    expect(typeof primera.body.nextCursor).toBe('string');

    const segunda = await request(app.getHttpServer())
      .get(`/api/chat/conversaciones?limit=1&cursor=${encodeURIComponent(primera.body.nextCursor)}`)
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(segunda.body.items).toHaveLength(1);

    const id1 = primera.body.items[0].conversacionId;
    const id2 = segunda.body.items[0].conversacionId;
    expect(id1).not.toBe(id2);
  });
});
