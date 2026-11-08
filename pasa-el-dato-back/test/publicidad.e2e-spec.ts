import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';

function obtenerCookie(
  encabezado: string | string[] | undefined,
  nombre: string,
): string | undefined {
  const cookies = Array.isArray(encabezado)
    ? encabezado
    : encabezado
      ? [encabezado]
      : [];

  return cookies
    .find((cookie) => cookie.startsWith(`${nombre}=`))
    ?.split(';')[0];
}

// PNG 1x1 transparente válido para probar MIME y firma sin usar archivos del repo.
const PNG_UN_PIXEL = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360a0' +
    '0000020001e221bc330000000049454e44ae426082',
  'hex',
);

describe('HU-PU-01 crear banner publicitario (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieMarca: string;
  let idCuentaMarca: string;
  let idSedeActiva: number;
  let correoMarca: string;

  const contrasenaMarca = 'marca-publicidad-e2e-123';

  async function iniciarSesion(): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoMarca, contrasena: contrasenaMarca })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error('No se recibió accessToken para la marca');
    }

    return cookie;
  }

  function solicitudCrearBanner(cookie = cookieMarca) {
    return request(app.getHttpServer())
      .post('/api/publicidad/banners')
      .set('Cookie', cookie)
      .attach('imagen', PNG_UN_PIXEL, 'banner.png')
      .field('mensaje', 'Promoción especial para la comunidad Duoc UC')
      .field('fechaInicio', '2026-12-01T00:00:00.000Z')
      .field('fechaFin', '2026-12-31T23:59:59.000Z')
      .field('sedes', JSON.stringify([idSedeActiva]));
  }

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
    const sede = await prisma.sede.findFirst({
      where: { activa: true, eliminado: false },
      select: { id: true },
    });

    if (!sede) {
      throw new Error('El e2e requiere una sede activa');
    }

    idSedeActiva = sede.id;
    const sufijo = randomUUID();
    correoMarca = `publicidad.${sufijo}@duocuc.cl`;

    const cuenta = await prisma.cuenta.create({
      data: {
        correo: correoMarca,
        claveHash: await generarHashContrasena(contrasenaMarca),
        telefono: '12345678',
        aprobada: true,
        marca: {
          create: { nombre: 'Marca publicidad e2e' },
        },
      },
      select: { id_cuenta: true },
    });

    idCuentaMarca = cuenta.id_cuenta;
    cookieMarca = await iniciarSesion();
  });

  afterEach(async () => {
    await prisma.bannerPublicidad.deleteMany({
      where: { fk_marca: idCuentaMarca },
    });
  });

  afterAll(async () => {
    await prisma.cuenta.deleteMany({ where: { id_cuenta: idCuentaMarca } });
    await app.close();
  });

  it('crea el banner y lo deja pendiente asociado a sus sedes', async () => {
    const respuesta = await solicitudCrearBanner().expect(201);

    expect(respuesta.body).toMatchObject({
      id: expect.any(String),
      mensaje: 'Promoción especial para la comunidad Duoc UC',
      estado: 'PENDIENTE',
      sedes: [{ id: idSedeActiva }],
    });
    expect(respuesta.body.imagen).toMatch(/^\/api\/uploads\/.+\.(png)$/);

    const banner = await prisma.bannerPublicidad.findUnique({
      where: { id: respuesta.body.id },
      select: {
        fk_marca: true,
        estado: true,
        sedes: { select: { fk_sede: true } },
      },
    });

    expect(banner).toEqual({
      fk_marca: idCuentaMarca,
      estado: 'PENDIENTE',
      sedes: [{ fk_sede: idSedeActiva }],
    });
  });

  it('rechaza fechas con fin anterior o igual al inicio', async () => {
    await solicitudCrearBanner()
      .field('fechaInicio', '2026-12-31T00:00:00.000Z')
      .field('fechaFin', '2026-12-01T00:00:00.000Z')
      .expect(400);
  });

  it('rechaza la creación sin sesión', async () => {
    await solicitudCrearBanner('').expect(401);
  });

  it('rechaza una sesión que no corresponde a una marca', async () => {
    const correoEstudiante = `no-marca.${randomUUID()}@duocuc.cl`;
    const cuenta = await prisma.cuenta.create({
      data: {
        correo: correoEstudiante,
        claveHash: await generarHashContrasena('estudiante-e2e-123'),
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            pNombre: 'No',
            pApellido: 'Marca',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSedeActiva } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
    });

    const respuestaLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoEstudiante, contrasena: 'estudiante-e2e-123' })
      .expect(200);
    const cookie = obtenerCookie(
      respuestaLogin.headers['set-cookie'],
      'accessToken',
    );

    await solicitudCrearBanner(cookie ?? '').expect(403);
    await prisma.cuenta.delete({ where: { id_cuenta: cuenta.id_cuenta } });
  });

  it('rechaza la creación sin sedes', async () => {
    await solicitudCrearBanner().field('sedes', '[]').expect(400);
  });

  it('permite al dueño editar mensaje, vigencia y sedes', async () => {
    const creado = await solicitudCrearBanner().expect(201);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicidad/banners/${creado.body.id}`)
      .set('Cookie', cookieMarca)
      .send({
        mensaje: 'Mensaje actualizado para la comunidad Duoc UC',
        fechaInicio: '2027-01-01T00:00:00.000Z',
        fechaFin: '2027-01-31T23:59:59.000Z',
        sedes: [idSedeActiva],
      })
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: creado.body.id,
      mensaje: 'Mensaje actualizado para la comunidad Duoc UC',
      estado: 'PENDIENTE',
      sedes: [{ id: idSedeActiva }],
    });

    const banner = await prisma.bannerPublicidad.findUnique({
      where: { id: creado.body.id },
      select: {
        mensaje: true,
        fechaInicio: true,
        fechaFin: true,
        estado: true,
        sedes: { select: { fk_sede: true } },
      },
    });

    expect(banner).toMatchObject({
      mensaje: 'Mensaje actualizado para la comunidad Duoc UC',
      fechaInicio: new Date('2027-01-01T00:00:00.000Z'),
      fechaFin: new Date('2027-01-31T23:59:59.000Z'),
      estado: 'PENDIENTE',
      sedes: [{ fk_sede: idSedeActiva }],
    });
  });

  it('rechaza editar un banner con fechas inválidas', async () => {
    const creado = await solicitudCrearBanner().expect(201);

    await request(app.getHttpServer())
      .patch(`/api/publicidad/banners/${creado.body.id}`)
      .set('Cookie', cookieMarca)
      .send({
        fechaInicio: '2027-02-01T00:00:00.000Z',
        fechaFin: '2027-01-01T00:00:00.000Z',
      })
      .expect(400);
  });

  it('el dueño elimina su banner de forma lógica e idempotente y queda auditado', async () => {
    const creado = await solicitudCrearBanner().expect(201);

    await request(app.getHttpServer())
      .delete(`/api/publicidad/banners/${creado.body.id}`)
      .set('Cookie', cookieMarca)
      .expect(204);

    const eliminado = await prisma.bannerPublicidad.findUniqueOrThrow({
      where: { id: creado.body.id },
      select: {
        eliminado: true,
        fk_modificado_por: true,
        fechaModificacion: true,
      },
    });

    expect(eliminado).toMatchObject({
      eliminado: true,
      fk_modificado_por: idCuentaMarca,
    });

    const fechaModificacionInicial = eliminado.fechaModificacion;

    await request(app.getHttpServer())
      .delete(`/api/publicidad/banners/${creado.body.id}`)
      .set('Cookie', cookieMarca)
      .expect(204);

    const eliminadoRepetido = await prisma.bannerPublicidad.findUniqueOrThrow({
      where: { id: creado.body.id },
      select: {
        eliminado: true,
        fk_modificado_por: true,
        fechaModificacion: true,
      },
    });

    expect(eliminadoRepetido).toEqual(eliminado);
    expect(eliminadoRepetido.fechaModificacion).toEqual(fechaModificacionInicial);

    const registrosAuditoria = await prisma.log_api.count({
      where: {
        fk_cuenta: idCuentaMarca,
        metodo: 'DELETE',
        ruta: `/api/publicidad/banners/${creado.body.id}`,
        codigo_estado: 204,
      },
    });
    expect(registrosAuditoria).toBeGreaterThanOrEqual(2);
  });

  it('deniega eliminar el banner de otra marca', async () => {
    const creado = await solicitudCrearBanner().expect(201);
    const correoOtraMarca = `otra-marca.${randomUUID()}@duocuc.cl`;
    const contrasenaOtraMarca = 'otra-marca-e2e-123';

    const cuenta = await prisma.cuenta.create({
      data: {
        correo: correoOtraMarca,
        claveHash: await generarHashContrasena(contrasenaOtraMarca),
        telefono: '12345678',
        aprobada: true,
        marca: { create: { nombre: 'Otra marca publicidad e2e' } },
      },
      select: { id_cuenta: true },
    });

    try {
      const respuestaLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ correo: correoOtraMarca, contrasena: contrasenaOtraMarca })
        .expect(200);
      const cookieAjena = obtenerCookie(
        respuestaLogin.headers['set-cookie'],
        'accessToken',
      );
      if (!cookieAjena) {
        throw new Error('No se recibió accessToken para la otra marca');
      }

      await request(app.getHttpServer())
        .delete(`/api/publicidad/banners/${creado.body.id}`)
        .set('Cookie', cookieAjena)
        .expect(403);

      await expect(
        prisma.bannerPublicidad.findUniqueOrThrow({
          where: { id: creado.body.id },
          select: { eliminado: true },
        }),
      ).resolves.toEqual({ eliminado: false });
    } finally {
      await prisma.log_api.deleteMany({
        where: { fk_cuenta: cuenta.id_cuenta },
      });
      await prisma.cuenta.delete({ where: { id_cuenta: cuenta.id_cuenta } });
    }
  });

  it('responde 404 para un banner inexistente y 400 para un UUID inválido', async () => {
    await request(app.getHttpServer())
      .delete(`/api/publicidad/banners/${randomUUID()}`)
      .set('Cookie', cookieMarca)
      .expect(404);

    await request(app.getHttpServer())
      .delete('/api/publicidad/banners/no-es-uuid')
      .set('Cookie', cookieMarca)
      .expect(400);
  });

  it('rechaza eliminar un banner sin sesión', async () => {
    const creado = await solicitudCrearBanner().expect(201);

    await request(app.getHttpServer())
      .delete(`/api/publicidad/banners/${creado.body.id}`)
      .expect(401);
  });
});
