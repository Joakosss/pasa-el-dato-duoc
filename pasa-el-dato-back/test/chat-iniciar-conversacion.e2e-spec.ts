import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
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

describe('Chat - iniciar conversación desde publicación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const contrasena = 'clave-temporal-chat';
  const correoVendedor = `chat.e2e.vendedor.${randomUUID()}@duocuc.cl`;
  const correoComprador = `chat.e2e.comprador.${randomUUID()}@duocuc.cl`;

  let idCuentaVendedor: string;
  let idCuentaComprador: string;

  let cookieVendedor: string;
  let cookieComprador: string;

  let publicacionId: string;

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

    const [estadoEnCurso, estadoPausada] = await Promise.all([
      asegurarEstado('En curso'),
      asegurarEstado('Pausada'),
    ]);

    // Vendida se requiere para un CA; lo aseguramos también para no depender del seed.
    await asegurarEstado('Vendida');

    // Registrar vendedor
    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo: correoVendedor,
        run: `${Date.now()}${randomInt(100000, 999999)}-1`,
        telefono: '12345678',
        contrasena,
        pNombre: 'Vendedor',
        pApellido: 'E2E',
        sApellido: 'Chat',
        sedeId: sede.id,
        carreraId: carrera.id,
      })
      .expect(201);

    const cuentaVendedor = await prisma.cuenta.findUniqueOrThrow({
      where: { correo: correoVendedor },
      select: { id_cuenta: true },
    });
    idCuentaVendedor = cuentaVendedor.id_cuenta;

    // Registrar comprador
    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo: correoComprador,
        run: `${Date.now()}${randomInt(100000, 999999)}-1`,
        telefono: '12345678',
        contrasena,
        pNombre: 'Comprador',
        pApellido: 'E2E',
        sApellido: 'Chat',
        sedeId: sede.id,
        carreraId: carrera.id,
      })
      .expect(201);

    const cuentaComprador = await prisma.cuenta.findUniqueOrThrow({
      where: { correo: correoComprador },
      select: { id_cuenta: true },
    });
    idCuentaComprador = cuentaComprador.id_cuenta;

    // Login vendedor
    const loginVendedor = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoVendedor, contrasena })
      .expect(200);
    const accessVendedor = obtenerCookie(loginVendedor.headers['set-cookie'], 'accessToken');
    if (!accessVendedor) throw new Error('login vendedor sin accessToken');
    cookieVendedor = accessVendedor;

    // Login comprador
    const loginComprador = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoComprador, contrasena })
      .expect(200);
    const accessComprador = obtenerCookie(loginComprador.headers['set-cookie'], 'accessToken');
    if (!accessComprador) throw new Error('login comprador sin accessToken');
    cookieComprador = accessComprador;

    // Crear publicación directamente en BD para controlar estado (evita dependencias de upload de imágenes).
    publicacionId = (
      await prisma.publicacion.create({
        data: {
          titulo: 'Publicación chat e2e',
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
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.publicacion.deleteMany({
        where: { titulo: 'Publicación chat e2e' },
      });
      await prisma.cuenta.deleteMany({
        where: { correo: { in: [correoVendedor, correoComprador] } },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('401 sin sesión', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .send({ publicacionId })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('404 si publicación no existe', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId: randomUUID() })
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });

  it('403 si el dueño intenta iniciar conversación consigo mismo', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieVendedor)
      .send({ publicacionId })
      .expect(403);

    expect(respuesta.body.message).toBe('No puede contactarse consigo mismo');
  });

  it('201 crea conversación (En curso)', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId })
      .expect(201);

    expect(typeof respuesta.body.conversacionId).toBe('string');
    expect(respuesta.body.creada).toBe(true);
  });

  it('201 idempotente: segunda llamada recupera la misma conversación', async () => {
    const primera = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId })
      .expect(201);

    const segunda = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId })
      .expect(201);

    expect(segunda.body.conversacionId).toBe(primera.body.conversacionId);
    expect(segunda.body.creada).toBe(false);
  });

  it('400 si la publicación está Pausada', async () => {
    const estadoPausada = await prisma.estadoPublicacion.findFirstOrThrow({
      where: { descripcion: 'Pausada' },
      select: { id: true },
    });

    await prisma.publicacion.update({
      where: { id: publicacionId },
      data: { fk_estado_publicacion: estadoPausada.id },
    });

    const respuesta = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId })
      .expect(400);

    expect(respuesta.body.message).toBe('Publicación no disponible para contacto');
  });

  it('201 permite contactar si la publicación está Vendida', async () => {
    const estadoVendido = await prisma.estadoPublicacion.findFirst({
      where: { descripcion: 'Vendida' },
      select: { id: true },
    });

    if (!estadoVendido) {
      throw new Error(
        'Falta estadoPublicacion "Vendida". Ejecuta seed o agrega el estado antes del test.',
      );
    }

    await prisma.publicacion.update({
      where: { id: publicacionId },
      data: { fk_estado_publicacion: estadoVendido.id },
    });

    const respuesta = await request(app.getHttpServer())
      .post('/api/chat/conversaciones')
      .set('Cookie', cookieComprador)
      .send({ publicacionId })
      .expect(201);

    expect(typeof respuesta.body.conversacionId).toBe('string');
    // puede ser false si ya existía (por idempotencia), lo importante es que permita.
    expect(typeof respuesta.body.creada).toBe('boolean');
  });
});
