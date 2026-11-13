import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';
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

  return cookies
    .find((cookie) => cookie.startsWith(`${nombre}=`))
    ?.split(';')[0];
}

describe('HU-ADM-04 dashboard administrativo de métricas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAdministrador: string;
  let cookieEstudiante: string;
  let idAdministrador: string;
  let idEstudiante: string;
  let idPublicacion: string;
  let idSede: number;
  let idCategoria: number;
  let idTipoVenta: number;
  let idEstado: number;

  const contrasenaAdministrador = 'admin-metricas-e2e-123';
  const contrasenaEstudiante = 'estudiante-metricas-e2e-123';
  const fechaDesde = new Date('2026-01-01T00:00:00.000Z');
  const fechaHasta = new Date('2026-02-01T00:00:00.000Z');

  async function iniciarSesion(correo: string, contrasena: string) {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) throw new Error(`No se recibió accessToken para ${correo}`);
    return cookie;
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

    const [sede, categoria, tipoVenta, estado] = await Promise.all([
      prisma.sede.findFirst({
        where: { activa: true, eliminado: false },
        select: { id: true },
      }),
      prisma.categoria.findFirst({ select: { id: true } }),
      prisma.tipoVenta.findFirst({ select: { id: true } }),
      prisma.estadoPublicacion.findFirst({
        where: { descripcion: 'En curso' },
        select: { id: true },
      }),
    ]);

    if (!sede || !categoria || !tipoVenta || !estado) {
      throw new Error('El e2e requiere catálogos disponibles');
    }

    idSede = sede.id;
    idCategoria = categoria.id;
    idTipoVenta = tipoVenta.id;
    idEstado = estado.id;

    const sufijo = randomUUID();
    const admin = await prisma.cuenta.create({
      data: {
        correo: `admin.metricas.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaAdministrador),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-metricas-admin`,
            pNombre: 'Admin',
            pApellido: 'Metricas',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Administrador' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idAdministrador = admin.id_cuenta;

    const estudiante = await prisma.cuenta.create({
      data: {
        correo: `estudiante.metricas.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaEstudiante),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-metricas-estudiante`,
            pNombre: 'Estudiante',
            pApellido: 'Metricas',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idEstudiante = estudiante.id_cuenta;

    cookieAdministrador = await iniciarSesion(
      admin.correo,
      contrasenaAdministrador,
    );
    cookieEstudiante = await iniciarSesion(
      estudiante.correo,
      contrasenaEstudiante,
    );

    const publicacion = await prisma.publicacion.create({
      data: {
        titulo: `Métrica ${sufijo}`,
        descripcion: 'Publicación usada en dashboard e2e.',
        precio: 1000,
        fk_estado_publicacion: idEstado,
        fk_tipoventa: idTipoVenta,
        fk_categoria: idCategoria,
        fk_usuario: idEstudiante,
        fk_sede: idSede,
        fechaCreacion: fechaDesde,
        fechaModificacion: fechaDesde,
        fk_user_comprador: idAdministrador,
      },
      select: { id: true },
    });
    idPublicacion = publicacion.id;

    await prisma.log_api.create({
      data: {
        metodo: 'GET',
        ruta: '/api/prueba-metricas',
        codigo_estado: 200,
        fk_cuenta: idEstudiante,
        fecha_hora: fechaDesde,
      },
    });
  });

  afterAll(async () => {
    await prisma.log_api.deleteMany({
      where: {
        fk_cuenta: { in: [idAdministrador, idEstudiante] },
        ruta: '/api/prueba-metricas',
      },
    });
    if (idPublicacion) {
      await prisma.publicacion.delete({ where: { id: idPublicacion } });
    }
    await prisma.cuenta.deleteMany({
      where: { id_cuenta: { in: [idAdministrador, idEstudiante] } },
    });
    await app.close();
  });

  it('rechaza acceso sin sesión y sin rol administrador', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/metricas/dashboard')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/metricas/dashboard')
      .set('Cookie', cookieEstudiante)
      .expect(403);
  });

  it('devuelve métricas agregadas para un administrador', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/admin/metricas/dashboard')
      .query({
        desde: fechaDesde.toISOString(),
        hasta: fechaHasta.toISOString(),
        sedeId: idSede,
      })
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      hayDatos: true,
      filtrosAplicados: {
        sedeId: idSede,
      },
      metricas: {
        usuariosActivos: 1,
        publicaciones: {
          total: 1,
          porCategoria: [
            { categoriaId: idCategoria, total: 1 },
          ],
          porSede: [{ sedeId: idSede, total: 1 }],
        },
        transaccionesTotales: 1,
      },
    });
  });

  it('informa cuando el periodo no tiene datos', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/admin/metricas/dashboard')
      .query({
        desde: '2099-01-01T00:00:00.000Z',
        hasta: '2099-02-01T00:00:00.000Z',
      })
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      hayDatos: false,
      mensajeSinDatos: 'Sin datos para el periodo o sede seleccionados.',
    });
  });

  it('rechaza un rango superior a 365 días', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/metricas/dashboard')
      .query({
        desde: '2024-01-01T00:00:00.000Z',
        hasta: '2026-01-01T00:00:00.000Z',
      })
      .set('Cookie', cookieAdministrador)
      .expect(400);
  });
});
