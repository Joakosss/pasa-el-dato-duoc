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

describe('HU-ADM-01 gestionar reportes de usuario (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAdministrador: string;
  let cookieEstudiante: string;
  let idCuentaAdministrador: string;
  let idCuentaReportado: string;
  let idCuentaNoAdmin: string;
  let idSede: number;
  let idReporte: string;

  const contrasenaAdministrador = 'admin-reportes-e2e-123';
  const contrasenaEstudiante = 'estudiante-reportes-e2e-123';

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

  async function crearReportePendiente() {
    const reporte = await prisma.reporteUsuario.create({
      data: {
        descripcion: 'Reporte e2e: conducta indebida',
        fk_reportado: idCuentaReportado,
        fk_reportante: idCuentaNoAdmin,
        estado: 'PENDIENTE',
      },
      select: { id: true },
    });

    idReporte = reporte.id;
  }

  async function limpiarReportes() {
    await prisma.reporteUsuario.deleteMany({
      where: {
        fk_reportado: { in: [idCuentaReportado] },
      },
    });
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

    const sede = await prisma.sede.findFirst({
      where: { activa: true, eliminado: false },
      select: { id: true },
    });
    if (!sede) throw new Error('El e2e requiere una sede activa');
    idSede = sede.id;

    const sufijo = randomUUID();

    const cuentaAdministrador = await prisma.cuenta.create({
      data: {
        correo: `admin.reportes.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaAdministrador),
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run: `${Date.now()}-adm`,
            pNombre: 'Admin',
            pApellido: 'Reportes',
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

    const cuentaReportado = await prisma.cuenta.create({
      data: {
        correo: `reportado.reportes.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaEstudiante),
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run: `${Date.now()}-rep`,
            pNombre: 'Usuario',
            pApellido: 'Reportado',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaReportado = cuentaReportado.id_cuenta;

    const cuentaNoAdmin = await prisma.cuenta.create({
      data: {
        correo: `noadmin.reportes.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaEstudiante),
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run: `${Date.now()}-na`,
            pNombre: 'Usuario',
            pApellido: 'NoAdmin',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaNoAdmin = cuentaNoAdmin.id_cuenta;

    cookieAdministrador = await iniciarSesion(
      cuentaAdministrador.correo,
      contrasenaAdministrador,
    );
    cookieEstudiante = await iniciarSesion(cuentaNoAdmin.correo, contrasenaEstudiante);
  });

  beforeEach(async () => {
    await limpiarReportes();
    await crearReportePendiente();
  });

  afterEach(async () => {
    await limpiarReportes();
  });

  afterAll(async () => {
    await prisma.cuenta.deleteMany({
      where: {
        id_cuenta: {
          in: [idCuentaAdministrador, idCuentaReportado, idCuentaNoAdmin],
        },
      },
    });
    await app.close();
  });

  it('rechaza acceso sin sesión', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/reportes/usuarios/pendientes')
      .expect(401);
  });

  it('rechaza acceso sin rol administrador', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/reportes/usuarios/pendientes')
      .set('Cookie', cookieEstudiante)
      .expect(403);
  });

  it('lista reportes pendientes con usuario involucrado', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/admin/reportes/usuarios/pendientes')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(respuesta.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: idReporte,
          estado: 'PENDIENTE',
          reportado: expect.objectContaining({
            id: idCuentaReportado,
          }),
        }),
      ]),
    );
  });

  it('entrega detalle del reporte e historial mínimo del usuario', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/admin/reportes/usuarios/${idReporte}`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: idReporte,
      descripcion: expect.any(String),
      estado: 'PENDIENTE',
      reportado: expect.objectContaining({
        id: idCuentaReportado,
        bloqueado: false,
        usuario: expect.any(Object),
      }),
    });
  });

  it('toma un reporte en revisión', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/usuarios/${idReporte}/tomar`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const reporte = await prisma.reporteUsuario.findUniqueOrThrow({
      where: { id: idReporte },
    });
    expect(reporte).toMatchObject({
      estado: 'EN_PROCESO',
      fk_admin_asignado: idCuentaAdministrador,
    });
  });

  it('resuelve por advertencia y registra auditoría en log_api', async () => {
    const antes = await prisma.log_api.count({
      where: { fk_cuenta: idCuentaAdministrador },
    });

    await request(app.getHttpServer())
      .post(`/api/admin/reportes/usuarios/${idReporte}/resolver/advertir`)
      .set('Cookie', cookieAdministrador)
      .send({ mensaje: 'Advertencia registrada por e2e' })
      .expect(200);

    const reporte = await prisma.reporteUsuario.findUniqueOrThrow({
      where: { id: idReporte },
    });
    expect(reporte).toMatchObject({
      estado: 'RESUELTO',
      resolucion: 'ADVERTENCIA',
      fk_admin_asignado: idCuentaAdministrador,
    });

    const despues = await prisma.log_api.count({
      where: { fk_cuenta: idCuentaAdministrador },
    });
    expect(despues).toBeGreaterThan(antes);
  });

  it('resuelve por bloqueo y aplica patrón BASE-EXTRA en Cuenta', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/usuarios/${idReporte}/resolver/bloquear`)
      .set('Cookie', cookieAdministrador)
      .send({ motivo: 'Bloqueo e2e' })
      .expect(200);

    const cuenta = await prisma.cuenta.findUniqueOrThrow({
      where: { id_cuenta: idCuentaReportado },
    });
    expect(cuenta).toMatchObject({
      bloqueado: true,
      motivoBloqueo: 'Bloqueo e2e',
      fk_modificado_por: idCuentaAdministrador,
    });
    expect(cuenta.fechaBloqueo).not.toBeNull();

    const reporte = await prisma.reporteUsuario.findUniqueOrThrow({
      where: { id: idReporte },
    });
    expect(reporte).toMatchObject({
      estado: 'RESUELTO',
      resolucion: 'BLOQUEO',
    });
  });

  it('permite reabrir un reporte resuelto', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/usuarios/${idReporte}/resolver/advertir`)
      .set('Cookie', cookieAdministrador)
      .send({ mensaje: 'Advertencia e2e' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/admin/reportes/usuarios/${idReporte}/reabrir`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const reporte = await prisma.reporteUsuario.findUniqueOrThrow({
      where: { id: idReporte },
    });
    expect(reporte).toMatchObject({
      estado: 'PENDIENTE',
      resolucion: null,
      fk_admin_asignado: null,
    });
  });

  it('permite descartar un reporte pendiente', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/usuarios/${idReporte}/descartar`)
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const reporte = await prisma.reporteUsuario.findUniqueOrThrow({
      where: { id: idReporte },
    });
    expect(reporte).toMatchObject({
      estado: 'DESCARTADO',
      resolucion: 'DESCARTE',
    });
  });

  it('rechaza operar sobre un reporte inexistente', async () => {
    await request(app.getHttpServer())
      .post(`/api/admin/reportes/usuarios/${randomUUID()}/tomar`)
      .set('Cookie', cookieAdministrador)
      .expect(404);
  });
});
