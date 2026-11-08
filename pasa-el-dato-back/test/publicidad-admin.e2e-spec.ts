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

describe('HU-PU-02 resolver banners publicitarios (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAdministrador: string;
  let cookieMarca: string;
  let cookieEstudiante: string;
  let idCuentaAdministrador: string;
  let idCuentaMarca: string;
  let idCuentaEstudiante: string;
  let idSede: number;
  let idBanner: string;

  const contrasenaAdministrador = 'admin-publicidad-e2e-123';
  const contrasenaMarca = 'marca-publicidad-e2e-123';
  const contrasenaEstudiante = 'estudiante-publicidad-e2e-123';

  async function iniciarSesion(correo: string, contrasena: string) {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error(`No se recibió accessToken para ${correo}`);
    }

    return cookie;
  }

  async function crearBanner(
    fechaInicio = new Date(Date.now() - 60_000),
    fechaFin = new Date(Date.now() + 86_400_000),
  ) {
    return prisma.bannerPublicidad.create({
      data: {
        fk_marca: idCuentaMarca,
        imagen: '/api/uploads/banner-e2e.png',
        mensaje: 'Banner pendiente para resolución e2e',
        fechaInicio,
        fechaFin,
        estado: 'PENDIENTE',
        sedes: { create: [{ fk_sede: idSede }] },
      },
      select: { id: true },
    });
  }

  async function limpiarBannersPendientesGlobales() {
    // Limpieza preventiva: si una corrida previa falló, pueden quedar banners PENDIENTE en la DB
    // y eso rompe las aserciones de paginación/total.
    await prisma.bannerSede.deleteMany({
      where: { banner: { estado: 'PENDIENTE' } },
    });
    await prisma.bannerPublicidad.deleteMany({ where: { estado: 'PENDIENTE' } });
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = modulo.get(PrismaService);

    await limpiarBannersPendientesGlobales();

    const sede = await prisma.sede.findFirst({
      where: { activa: true, eliminado: false },
      select: { id: true },
    });
    if (!sede) throw new Error('El e2e requiere una sede activa');
    idSede = sede.id;

    const sufijo = randomUUID();
    const cuentaAdministrador = await prisma.cuenta.create({
      data: {
        correo: `admin.publicidad.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaAdministrador),
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run: `${Date.now()}-1`,
            pNombre: 'Admin',
            pApellido: 'Publicidad',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Administrador' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaAdministrador = cuentaAdministrador.id_cuenta;

    const cuentaMarca = await prisma.cuenta.create({
      data: {
        correo: `marca.publicidad.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaMarca),
        telefono: '12345678',
        aprobada: true,
        marca: { create: { nombre: `Marca resolución ${sufijo}` } },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaMarca = cuentaMarca.id_cuenta;

    const cuentaEstudiante = await prisma.cuenta.create({
      data: {
        correo: `estudiante.publicidad.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaEstudiante),
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run: `${Date.now()}-2`,
            pNombre: 'Estudiante',
            pApellido: 'Publicidad',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaEstudiante = cuentaEstudiante.id_cuenta;

    cookieAdministrador = await iniciarSesion(
      cuentaAdministrador.correo,
      contrasenaAdministrador,
    );
    cookieMarca = await iniciarSesion(cuentaMarca.correo, contrasenaMarca);
    cookieEstudiante = await iniciarSesion(
      cuentaEstudiante.correo,
      contrasenaEstudiante,
    );
  });

  beforeEach(async () => {
    await limpiarBannersPendientes();
    const banner = await crearBanner();
    idBanner = banner.id;
  });

  afterEach(async () => {
    await prisma.$executeRawUnsafe(
      'DELETE FROM notificacion_marca WHERE fk_marca = $1::uuid',
      idCuentaMarca,
    );
    await prisma.bannerSede.deleteMany({
      where: { banner: { fk_marca: idCuentaMarca } },
    });
    await prisma.bannerPublicidad.deleteMany({ where: { fk_marca: idCuentaMarca } });
  });

  async function limpiarBannersPendientes() {
    await prisma.$executeRawUnsafe(
      `DELETE FROM notificacion_marca WHERE fk_banner IN (
        SELECT id FROM banner_publicidad WHERE estado = 'PENDIENTE' AND fk_marca = $1::uuid
      )`,
      idCuentaMarca,
    );
    await prisma.bannerSede.deleteMany({
      where: { banner: { estado: 'PENDIENTE', fk_marca: idCuentaMarca } },
    });
    await prisma.bannerPublicidad.deleteMany({
      where: { estado: 'PENDIENTE', fk_marca: idCuentaMarca },
    });
  }

  afterAll(async () => {
    await prisma.cuenta.deleteMany({
      where: {
        id_cuenta: {
          in: [idCuentaAdministrador, idCuentaMarca, idCuentaEstudiante],
        },
      },
    });
    await app.close();
  });

  it('lista pendientes con marca y sedes para un administrador', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/admin/publicidad/banners?estado=PENDIENTE')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(respuesta.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: idBanner,
          estado: 'PENDIENTE',
          marca: expect.objectContaining({ id: idCuentaMarca }),
          sedes: expect.arrayContaining([expect.objectContaining({ id: idSede })]),
        }),
      ]),
    );
    expect(respuesta.body.pagination).toMatchObject({ page: 1, pageSize: 20 });
  });

  it('aprueba un banner y persiste la resolución administrativa', async () => {
    const respuesta = await request(app.getHttpServer())
      .post(`/api/admin/publicidad/banners/${idBanner}/aprobar`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: idBanner,
      estado: 'APROBADO',
      fechaAprobacion: expect.any(String),
    });

    const banner = await prisma.bannerPublicidad.findUniqueOrThrow({
      where: { id: idBanner },
    });
    expect(banner).toMatchObject({
      estado: 'APROBADO',
      fk_modificado_por: idCuentaAdministrador,
    });
  });

  it('rechaza un banner, exige motivo y notifica a la marca', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/publicidad/banners/${idBanner}/rechazar`)
      .set('Cookie', cookieAdministrador)
      .send({})
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/admin/publicidad/banners/${idBanner}/rechazar`)
      .set('Cookie', cookieAdministrador)
      .send({ motivo: 'No cumple la normativa institucional' })
      .expect(200);

    const banner = await prisma.bannerPublicidad.findUniqueOrThrow({
      where: { id: idBanner },
    });
    expect(banner).toMatchObject({
      estado: 'RECHAZADO',
      fk_modificado_por: idCuentaAdministrador,
    });
    const bannerEnDb = await prisma.$queryRawUnsafe<Array<{ motivoRechazo: string | null }>>(
      `SELECT motivo_rechazo AS "motivoRechazo"
         FROM banner_publicidad
        WHERE id = $1::uuid`,
      idBanner,
    );
    expect(bannerEnDb[0]?.motivoRechazo).toBe('No cumple la normativa institucional');

    const notificaciones = await prisma.$queryRawUnsafe<
      Array<{ tipo: string; fk_marca: string; fk_banner: string }>
    >(
      `SELECT tipo, fk_marca, fk_banner
         FROM notificacion_marca
        WHERE fk_banner = $1::uuid AND fk_marca = $2::uuid`,
      idBanner,
      idCuentaMarca,
    );
    expect(notificaciones[0]).toMatchObject({
      tipo: 'BANNER_RECHAZADO',
      fk_marca: idCuentaMarca,
      fk_banner: idBanner,
    });
  });

  it('rechaza resolver sin rol de administrador', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/publicidad/banners/${idBanner}/aprobar`)
      .set('Cookie', cookieEstudiante)
      .expect(403);
  });

  it('rechaza la aprobación cuando la marca ya tiene tres activos simultáneos', async () => {
    await prisma.bannerPublicidad.createMany({
      data: [1, 2, 3].map(() => ({
        fk_marca: idCuentaMarca,
        imagen: '/api/uploads/banner-activo-e2e.png',
        mensaje: 'Banner activo e2e',
        fechaInicio: new Date(Date.now() - 60_000),
        fechaFin: new Date(Date.now() + 86_400_000),
        estado: 'APROBADO' as const,
      })),
    });

    await request(app.getHttpServer())
      .post(`/api/admin/publicidad/banners/${idBanner}/aprobar`)
      .set('Cookie', cookieAdministrador)
      .expect(409);

    await expect(
      prisma.bannerPublicidad.findUniqueOrThrow({ where: { id: idBanner } }),
    ).resolves.toMatchObject({ estado: 'PENDIENTE' });
  });

  it('mantiene pendiente un banner cuyo inicio ya pasó hasta resolverlo', async () => {
    await prisma.bannerPublicidad.update({
      where: { id: idBanner },
      data: {
        fechaInicio: new Date(Date.now() - 86_400_000),
        fechaFin: new Date(Date.now() + 86_400_000),
      },
    });

    const respuesta = await request(app.getHttpServer())
      .get('/api/admin/publicidad/banners?estado=PENDIENTE')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(respuesta.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: idBanner, estado: 'PENDIENTE' })]),
    );
  });

  it('rechaza un banner inexistente', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/publicidad/banners/${randomUUID()}/aprobar`)
      .set('Cookie', cookieAdministrador)
      .expect(404);
  });

  it('expone la creación de banner solo a la marca', async () => {
    await request(app.getHttpServer())
      .post('/api/publicidad/banners')
      .set('Cookie', cookieAdministrador)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/publicidad/banners')
      .set('Cookie', cookieEstudiante)
      .expect(403);
    expect(cookieMarca).toContain('accessToken=');
  });
});
