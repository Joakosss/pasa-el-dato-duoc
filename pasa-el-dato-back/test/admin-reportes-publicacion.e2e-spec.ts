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

describe('HU-ADM-02 gestionar reportes de publicación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAdministrador: string;
  let cookieEstudiante: string;
  let idCuentaAdministrador: string;
  let idCuentaVendedor: string;
  let idCuentaNoAdmin: string;
  let idPublicacion: string;
  let idReporte: string;
  let idSede: number;
  let idCategoria: number;
  let idTipoVenta: number;
  let idEstadoEnCurso: number;

  const contrasenaAdministrador = 'admin-publicaciones-e2e-123';
  const contrasenaEstudiante = 'estudiante-publicaciones-e2e-123';

  async function iniciarSesion(correo: string, contrasena: string) {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) throw new Error(`No se recibió accessToken para ${correo}`);
    return cookie;
  }

  async function crearReporte(estado: 'PENDIENTE' | 'RESUELTO' = 'PENDIENTE') {
    const reporte = await prisma.reportePublicacion.create({
      data: {
        motivo: 'Contenido contrario a normativa',
        comentarios: 'Reporte creado para prueba e2e.',
        fk_publicacion: idPublicacion,
        fk_reportante: idCuentaNoAdmin,
        estado,
        ...(estado === 'RESUELTO'
          ? {
              resolucion: 'ADVERTENCIA',
              mensajeAdvertencia: 'Advertencia previa',
              fk_admin_asignado: idCuentaAdministrador,
              fechaResolucion: new Date(),
            }
          : {}),
      },
      select: { id: true },
    });

    idReporte = reporte.id;
  }

  async function limpiarDatosDePrueba() {
    await prisma.reportePublicacion.deleteMany({
      where: {
        OR: [
          { fk_publicacion: idPublicacion },
          { fk_reportante: idCuentaNoAdmin },
          { fk_admin_asignado: idCuentaAdministrador },
        ],
      },
    });

    await prisma.auditoriaAdmin.deleteMany({
      where: { fk_admin: idCuentaAdministrador },
    });

    if (idPublicacion) {
      await prisma.publicacion.deleteMany({ where: { id: idPublicacion } });
    }
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
      throw new Error('El e2e requiere catálogos de publicación disponibles');
    }

    idSede = sede.id;
    idCategoria = categoria.id;
    idTipoVenta = tipoVenta.id;
    idEstadoEnCurso = estado.id;

    const sufijo = randomUUID();

    const administrador = await prisma.cuenta.create({
      data: {
        correo: `admin.pub.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaAdministrador),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-adm`,
            pNombre: 'Admin',
            pApellido: 'Publicaciones',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Administrador' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaAdministrador = administrador.id_cuenta;

    const vendedor = await prisma.cuenta.create({
      data: {
        correo: `vendedor.pub.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaEstudiante),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-ven`,
            pNombre: 'Vendedor',
            pApellido: 'Publicación',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaVendedor = vendedor.id_cuenta;

    const noAdmin = await prisma.cuenta.create({
      data: {
        correo: `reportante.pub.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaEstudiante),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-rep`,
            pNombre: 'Reportante',
            pApellido: 'Publicación',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaNoAdmin = noAdmin.id_cuenta;

    const publicacion = await prisma.publicacion.create({
      data: {
        titulo: `Publicación reportada ${sufijo}`,
        descripcion: 'Publicación usada en pruebas administrativas.',
        precio: 1000,
        fk_estado_publicacion: idEstadoEnCurso,
        fk_tipoventa: idTipoVenta,
        fk_categoria: idCategoria,
        fk_usuario: idCuentaVendedor,
        fk_sede: idSede,
      },
      select: { id: true },
    });
    idPublicacion = publicacion.id;

    cookieAdministrador = await iniciarSesion(
      administrador.correo,
      contrasenaAdministrador,
    );
    cookieEstudiante = await iniciarSesion(noAdmin.correo, contrasenaEstudiante);
  });

  beforeEach(async () => {
    await limpiarDatosDePrueba();
    const publicacion = await prisma.publicacion.create({
      data: {
        titulo: `Publicación reportada ${randomUUID()}`,
        descripcion: 'Publicación usada en pruebas administrativas.',
        precio: 1000,
        fk_estado_publicacion: idEstadoEnCurso,
        fk_tipoventa: idTipoVenta,
        fk_categoria: idCategoria,
        fk_usuario: idCuentaVendedor,
        fk_sede: idSede,
      },
      select: { id: true },
    });
    idPublicacion = publicacion.id;
    await crearReporte();
  });

  afterAll(async () => {
    await limpiarDatosDePrueba();
    await prisma.cuenta.deleteMany({
      where: {
        id_cuenta: {
          in: [idCuentaAdministrador, idCuentaVendedor, idCuentaNoAdmin],
        },
      },
    });
    await app.close();
  });

  it('rechaza acceso sin sesión y sin rol administrador', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/reportes/publicaciones/pendientes')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/reportes/publicaciones/pendientes')
      .set('Cookie', cookieEstudiante)
      .expect(403);
  });

  it('lista pendientes y entrega el detalle de publicación y contexto', async () => {
    const lista = await request(app.getHttpServer())
      .get('/api/admin/reportes/publicaciones/pendientes')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(lista.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: idReporte,
          estado: 'PENDIENTE',
          publicacion: expect.objectContaining({ id: idPublicacion }),
        }),
      ]),
    );

    const detalle = await request(app.getHttpServer())
      .get(`/api/admin/reportes/publicaciones/${idReporte}`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(detalle.body).toMatchObject({
      id: idReporte,
      estado: 'PENDIENTE',
      motivo: 'Contenido contrario a normativa',
      publicacion: expect.objectContaining({
        id: idPublicacion,
        titulo: expect.any(String),
      }),
    });
  });

  it('toma en revisión y registra auditoría', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/publicaciones/${idReporte}/tomar`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const reporte = await prisma.reportePublicacion.findUniqueOrThrow({
      where: { id: idReporte },
    });
    expect(reporte).toMatchObject({
      estado: 'EN_PROCESO',
      fk_admin_asignado: idCuentaAdministrador,
    });

    expect(
      await prisma.auditoriaAdmin.count({
        where: { entidadId: idReporte, accion: 'TOMAR_REPORTE_PUBLICACION' },
      }),
    ).toBe(1);
  });

  it('descarta sin modificar la publicación', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/publicaciones/${idReporte}/descartar`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const [reporte, publicacion] = await Promise.all([
      prisma.reportePublicacion.findUniqueOrThrow({ where: { id: idReporte } }),
      prisma.publicacion.findUniqueOrThrow({ where: { id: idPublicacion } }),
    ]);

    expect(reporte).toMatchObject({
      estado: 'DESCARTADO',
      resolucion: 'DESCARTE',
    });
    expect(publicacion.eliminado).toBe(false);
  });

  it('registra advertencia y mantiene activa la publicación', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/publicaciones/${idReporte}/resolver/advertir`)
      .set('Cookie', cookieAdministrador)
      .send({ mensaje: 'Advertencia administrativa e2e' })
      .expect(200);

    const [reporte, publicacion] = await Promise.all([
      prisma.reportePublicacion.findUniqueOrThrow({ where: { id: idReporte } }),
      prisma.publicacion.findUniqueOrThrow({ where: { id: idPublicacion } }),
    ]);

    expect(reporte).toMatchObject({
      estado: 'RESUELTO',
      resolucion: 'ADVERTENCIA',
      mensajeAdvertencia: 'Advertencia administrativa e2e',
    });
    expect(publicacion.eliminado).toBe(false);
  });

  it('reabre un reporte resuelto y vuelve a pendiente', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/publicaciones/${idReporte}/resolver/advertir`)
      .set('Cookie', cookieAdministrador)
      .send({ mensaje: 'Advertencia previa' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/admin/reportes/publicaciones/${idReporte}/reabrir`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const reporte = await prisma.reportePublicacion.findUniqueOrThrow({
      where: { id: idReporte },
    });
    expect(reporte).toMatchObject({
      estado: 'PENDIENTE',
      resolucion: null,
      fk_admin_asignado: null,
    });
  });

  it('retira publicación, resuelve reporte, registra aviso y auditoría', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/publicaciones/${idReporte}/resolver/retirar`)
      .set('Cookie', cookieAdministrador)
      .send({ motivo: 'Retiro administrativo e2e' })
      .expect(200);

    const [reporte, publicacion] = await Promise.all([
      prisma.reportePublicacion.findUniqueOrThrow({ where: { id: idReporte } }),
      prisma.publicacion.findUniqueOrThrow({ where: { id: idPublicacion } }),
    ]);

    expect(reporte).toMatchObject({
      estado: 'RESUELTO',
      resolucion: 'RETIRO_PUBLICACION',
      avisoVendedorRegistrado: true,
    });
    expect(reporte.avisoVendedorFecha).not.toBeNull();
    expect(publicacion).toMatchObject({
      eliminado: true,
      fk_modificado_por: idCuentaAdministrador,
    });

    expect(
      await prisma.auditoriaAdmin.count({
        where: {
          entidad: 'Publicacion',
          entidadId: idPublicacion,
          accion: 'RETIRAR_PUBLICACION',
        },
      }),
    ).toBe(1);

    await request(app.getHttpServer())
      .get(`/api/publicaciones/${idPublicacion}`)
      .expect(404);
  });

  it('rechaza gestionar un reporte inexistente', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/publicaciones/${randomUUID()}/tomar`)
      .set('Cookie', cookieAdministrador)
      .expect(404);
  });
});
