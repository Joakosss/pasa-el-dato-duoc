import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';
import { REPORTE_USUARIO_COMENTARIO_MAX_LEN } from '../src/reporte-usuario/reportes-usuario.constantes.js';

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

// HU-REP-02 (BE10): e2e del flujo de creación de reportes de usuario.
describe('HU-REP-02 reportar usuario (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieReportanteA: string;
  let cookieReportanteC: string;
  let cookieReportado: string;
  let idCuentaReportado: string;
  let idCuentaReportadoEliminado: string;
  let idCuentaReportanteA: string;
  let idCuentaReportanteC: string;
  let idSede: number;
  let idMotivo: number;

  const contrasena = 'reporte-usuario-e2e-123';

  async function iniciarSesion(correo: string) {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) throw new Error(`No se recibió accessToken para ${correo}`);
    return cookie;
  }

  async function crearCuenta(
    sufijo: string,
    prefijo: string,
    eliminado = false,
  ) {
    return prisma.cuenta.create({
      data: {
        correo: `${prefijo}.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasena),
        telefono: '12345678',
        eliminado,
        usuario: {
          create: {
            run: `${Date.now()}-${prefijo}`,
            pNombre: prefijo,
            pApellido: 'Reporte',
            sApellido: 'Usuario E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
  }

  function reportar(
    cookie: string | undefined,
    cuerpo: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .post('/api/reportes/usuarios')
      .set('Cookie', cookie ?? '')
      .send(cuerpo);
  }

  async function limpiarDatosDePrueba() {
    await prisma.reporteUsuario.deleteMany({
      where: {
        fk_reportado: {
          in: [idCuentaReportado, idCuentaReportadoEliminado].filter(Boolean),
        },
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

    const [sede, motivoReporte] = await Promise.all([
      prisma.sede.findFirst({
        where: { activa: true, eliminado: false },
        select: { id: true },
      }),
      prisma.motivoReporteUsuario.findFirst({ select: { id: true } }),
    ]);

    if (!sede || !motivoReporte) {
      throw new Error('El e2e requiere sede activa y catálogo de motivos');
    }

    idSede = sede.id;
    idMotivo = motivoReporte.id;

    const sufijo = randomUUID();

    const reportado = await crearCuenta(sufijo, 'reportado');
    idCuentaReportado = reportado.id_cuenta;
    const reportadoEliminado = await crearCuenta(
      sufijo,
      'reportadoelim',
      true,
    );
    idCuentaReportadoEliminado = reportadoEliminado.id_cuenta;
    const reportanteA = await crearCuenta(sufijo, 'reportantea');
    idCuentaReportanteA = reportanteA.id_cuenta;
    const reportanteC = await crearCuenta(sufijo, 'reportantec');
    idCuentaReportanteC = reportanteC.id_cuenta;

    cookieReportado = await iniciarSesion(reportado.correo);
    cookieReportanteA = await iniciarSesion(reportanteA.correo);
    cookieReportanteC = await iniciarSesion(reportanteC.correo);
  });

  beforeEach(async () => {
    await limpiarDatosDePrueba();
  });

  afterAll(async () => {
    await limpiarDatosDePrueba();

    await prisma.cuenta.deleteMany({
      where: {
        id_cuenta: {
          in: [
            idCuentaReportado,
            idCuentaReportadoEliminado,
            idCuentaReportanteA,
            idCuentaReportanteC,
          ].filter(Boolean),
        },
      },
    });

    await app.close();
  });

  it('CA8: rechaza sin sesión con 401', async () => {
    await reportar(undefined, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
    }).expect(401);
  });

  it('CA9: catálogo de motivos accesible sin sesión', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/motivos-reporte-usuario')
      .expect(200);

    expect(Array.isArray(respuesta.body)).toBe(true);
    expect(respuesta.body.length).toBeGreaterThan(0);
    expect(respuesta.body[0]).toHaveProperty('id');
    expect(respuesta.body[0]).toHaveProperty('nombre');
  });

  it('CA1: registra el reporte con autoría y estado PENDIENTE', async () => {
    const respuesta = await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
      comentarios: 'Me estafó en la venta del cargador.',
    }).expect(201);

    expect(respuesta.body).toMatchObject({
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
      estado: 'PENDIENTE',
    });

    const reporte = await prisma.reporteUsuario.findUniqueOrThrow({
      where: { id: respuesta.body.id },
      select: { fk_reportante: true, estado: true, fk_motivo: true },
    });
    expect(reporte.fk_reportante).toBe(idCuentaReportanteA);
    expect(reporte.estado).toBe('PENDIENTE');
    expect(reporte.fk_motivo).toBe(idMotivo);
  });

  it('CA2: no duplica un reporte propio en curso', async () => {
    await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
    }).expect(201);

    await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
    }).expect(409);
  });

  it('CA3: reportes de reportantes distintos coexisten', async () => {
    const primera = await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
    }).expect(201);

    const segunda = await reportar(cookieReportanteC, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
    }).expect(201);

    expect(primera.body.id).not.toBe(segunda.body.id);
  });

  it('CA4: rechaza un usuario reportado inexistente con 404', async () => {
    await reportar(cookieReportanteA, {
      usuarioReportadoId: randomUUID(),
      motivoId: idMotivo,
    }).expect(404);
  });

  it('CA6: rechaza un usuario reportado eliminado con 409', async () => {
    await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportadoEliminado,
      motivoId: idMotivo,
    }).expect(409);
  });

  it('CA5: rechaza el autoreporte con 409', async () => {
    await reportar(cookieReportado, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
    }).expect(409);
  });

  it('CA7: rechaza el envío sin motivo indicando el campo', async () => {
    const respuesta = await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportado,
    }).expect(400);

    expect(JSON.stringify(respuesta.body.message)).toContain('motivoId');
  });

  it('CA7: rechaza un motivo inexistente con 422', async () => {
    await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: 999999,
    }).expect(422);
  });

  it('CA11: rechaza un UUID de usuario malformado con 400', async () => {
    await reportar(cookieReportanteA, {
      usuarioReportadoId: 'no-es-uuid',
      motivoId: idMotivo,
    }).expect(400);
  });

  it('CA11: rechaza comentarios sobre el máximo con 400', async () => {
    await reportar(cookieReportanteA, {
      usuarioReportadoId: idCuentaReportado,
      motivoId: idMotivo,
      comentarios: 'x'.repeat(REPORTE_USUARIO_COMENTARIO_MAX_LEN + 1),
    }).expect(400);
  });
});
