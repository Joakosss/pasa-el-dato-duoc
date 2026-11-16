import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';
import { REPORTE_COMENTARIO_MAX_LEN } from '../src/reporte-publicacion/reportes-publicacion.constantes.js';

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

// HU-REP-01 (BE10): e2e del flujo de creación de reportes de publicación.
describe('HU-REP-01 reportar publicación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieReportanteA: string;
  let cookieReportanteC: string;
  let cookieVendedorB: string;
  let idCuentaVendedor: string;
  let idCuentaReportanteA: string;
  let idCuentaReportanteC: string;
  let idPublicacionEnCurso: string;
  let idPublicacionPausada: string;
  let idPublicacionVendida: string;
  let idSede: number;
  let idCategoria: number;
  let idTipoVenta: number;
  let idEstadoEnCurso: number;
  let idEstadoPausado: number;
  let idEstadoVendido: number;
  let idMotivo: number;

  const contrasena = 'reporte-creacion-e2e-123';

  async function iniciarSesion(correo: string) {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) throw new Error(`No se recibió accessToken para ${correo}`);
    return cookie;
  }

  async function crearCuenta(sufijo: string, prefijo: string) {
    return prisma.cuenta.create({
      data: {
        correo: `${prefijo}.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasena),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-${prefijo}`,
            pNombre: prefijo,
            pApellido: 'Reporte',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
  }

  function crearPublicacion(
    sufijo: string,
    vendedorId: string,
    estadoId: number,
    eliminado = false,
  ) {
    return prisma.publicacion.create({
      data: {
        titulo: `Publicación ${sufijo}`,
        descripcion: 'Publicación usada en pruebas de reporte.',
        precio: 1000,
        fk_estado_publicacion: estadoId,
        fk_tipoventa: idTipoVenta,
        fk_categoria: idCategoria,
        fk_usuario: vendedorId,
        fk_sede: idSede,
        eliminado,
      },
      select: { id: true },
    });
  }

  async function limpiarDatosDePrueba() {
    await prisma.reportePublicacion.deleteMany({
      where: {
        OR: [
          { fk_publicacion: idPublicacionEnCurso },
          { fk_publicacion: idPublicacionPausada },
          { fk_publicacion: idPublicacionVendida },
        ],
      },
    });
  }

  function reportar(
    cookie: string | undefined,
    cuerpo: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .post('/api/reportes/publicaciones')
      .set('Cookie', cookie ?? '')
      .send(cuerpo);
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

    const [sede, categoria, tipoVenta, estados, motivoReporte] =
      await Promise.all([
        prisma.sede.findFirst({
          where: { activa: true, eliminado: false },
          select: { id: true },
        }),
        prisma.categoria.findFirst({ select: { id: true } }),
        prisma.tipoVenta.findFirst({ select: { id: true } }),
        prisma.estadoPublicacion.findMany({
          where: { descripcion: { in: ['En curso', 'Pausado', 'Vendido'] } },
          select: { id: true, descripcion: true },
        }),
        prisma.motivoReporte.findFirst({ select: { id: true } }),
      ]);

    if (
      !sede ||
      !categoria ||
      !tipoVenta ||
      estados.length < 3 ||
      !motivoReporte
    ) {
      throw new Error('El e2e requiere catálogos de publicación disponibles');
    }

    idSede = sede.id;
    idCategoria = categoria.id;
    idTipoVenta = tipoVenta.id;
    idEstadoEnCurso = estados.find((e) => e.descripcion === 'En curso')!.id;
    idEstadoPausado = estados.find((e) => e.descripcion === 'Pausado')!.id;
    idEstadoVendido = estados.find((e) => e.descripcion === 'Vendido')!.id;
    idMotivo = motivoReporte.id;

    const sufijo = randomUUID();

    const vendedor = await crearCuenta(sufijo, 'vendedor');
    idCuentaVendedor = vendedor.id_cuenta;
    const reportanteA = await crearCuenta(sufijo, 'reportantea');
    idCuentaReportanteA = reportanteA.id_cuenta;
    const reportanteC = await crearCuenta(sufijo, 'reportantec');
    idCuentaReportanteC = reportanteC.id_cuenta;

    const enCurso = await crearPublicacion(
      `en-curso ${sufijo}`,
      idCuentaVendedor,
      idEstadoEnCurso,
    );
    idPublicacionEnCurso = enCurso.id;
    const pausada = await crearPublicacion(
      `pausada ${sufijo}`,
      idCuentaVendedor,
      idEstadoPausado,
    );
    idPublicacionPausada = pausada.id;
    const vendida = await crearPublicacion(
      `vendida ${sufijo}`,
      idCuentaVendedor,
      idEstadoVendido,
    );
    idPublicacionVendida = vendida.id;

    cookieVendedorB = await iniciarSesion(vendedor.correo);
    cookieReportanteA = await iniciarSesion(reportanteA.correo);
    cookieReportanteC = await iniciarSesion(reportanteC.correo);
  });

  beforeEach(async () => {
    await limpiarDatosDePrueba();
  });

  afterAll(async () => {
    await limpiarDatosDePrueba();

    for (const idPublicacion of [
      idPublicacionEnCurso,
      idPublicacionPausada,
      idPublicacionVendida,
    ]) {
      if (idPublicacion) {
        await prisma.publicacion.deleteMany({ where: { id: idPublicacion } });
      }
    }

    await prisma.cuenta.deleteMany({
      where: {
        id_cuenta: {
          in: [idCuentaVendedor, idCuentaReportanteA, idCuentaReportanteC],
        },
      },
    });

    await app.close();
  });

  it('CA9: rechaza sin sesión con 401', async () => {
    await reportar(undefined, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
    }).expect(401);
  });

  it('CA10: catálogo de motivos accesible sin sesión', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/motivos-reporte')
      .expect(200);

    expect(Array.isArray(respuesta.body)).toBe(true);
    expect(respuesta.body.length).toBeGreaterThan(0);
    expect(respuesta.body[0]).toHaveProperty('id');
    expect(respuesta.body[0]).toHaveProperty('nombre');
  });

  it('CA1: registra el reporte con autoría y estado PENDIENTE', async () => {
    const respuesta = await reportar(cookieReportanteA, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
      comentarios: 'Incumple las normas del catálogo.',
    }).expect(201);

    expect(respuesta.body).toMatchObject({
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
      estado: 'PENDIENTE',
    });

    const reporte = await prisma.reportePublicacion.findUniqueOrThrow({
      where: { id: respuesta.body.id },
      select: { fk_reportante: true, estado: true, motivo: true },
    });
    expect(reporte.fk_reportante).toBe(idCuentaReportanteA);
    expect(reporte.estado).toBe('PENDIENTE');
  });

  it('CA2: no duplica un reporte propio en curso', async () => {
    await reportar(cookieReportanteA, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
    }).expect(201);

    await reportar(cookieReportanteA, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
    }).expect(409);
  });

  it('CA3: reportes de reportantes distintos coexisten', async () => {
    const primera = await reportar(cookieReportanteA, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
    }).expect(201);

    const segunda = await reportar(cookieReportanteC, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
    }).expect(201);

    expect(primera.body.id).not.toBe(segunda.body.id);
  });

  it('CA4: rechaza una publicación inexistente con 404', async () => {
    await reportar(cookieReportanteA, {
      publicacionId: randomUUID(),
      motivoId: idMotivo,
    }).expect(404);
  });

  it('CA5: rechaza el reporte de la propia publicación con 409', async () => {
    await reportar(cookieVendedorB, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
    }).expect(409);
  });

  it('CA6: rechaza publicaciones pausadas con 409', async () => {
    await reportar(cookieReportanteA, {
      publicacionId: idPublicacionPausada,
      motivoId: idMotivo,
    }).expect(409);
  });

  it('CA6: rechaza publicaciones eliminadas con 409', async () => {
    const eliminada = await crearPublicacion(
      `eliminada ${randomUUID()}`,
      idCuentaVendedor,
      idEstadoEnCurso,
      true,
    );

    try {
      await reportar(cookieReportanteA, {
        publicacionId: eliminada.id,
        motivoId: idMotivo,
      }).expect(409);
    } finally {
      await prisma.publicacion.deleteMany({ where: { id: eliminada.id } });
    }
  });

  it('CA7: permite reportar publicaciones vendidas', async () => {
    await reportar(cookieReportanteA, {
      publicacionId: idPublicacionVendida,
      motivoId: idMotivo,
    }).expect(201);
  });

  it('CA8: rechaza el envío sin motivo indicando el campo', async () => {
    const respuesta = await reportar(cookieReportanteA, {
      publicacionId: idPublicacionEnCurso,
    }).expect(400);

    expect(JSON.stringify(respuesta.body.message)).toContain('motivoId');
  });

  it('CA8: rechaza un motivo inexistente con 422', async () => {
    await reportar(cookieReportanteA, {
      publicacionId: idPublicacionEnCurso,
      motivoId: 999999,
    }).expect(422);
  });

  it('rechaza un UUID de publicación malformado con 400', async () => {
    await reportar(cookieReportanteA, {
      publicacionId: 'no-es-uuid',
      motivoId: idMotivo,
    }).expect(400);
  });

  it('rechaza comentarios sobre el máximo con 400', async () => {
    await reportar(cookieReportanteA, {
      publicacionId: idPublicacionEnCurso,
      motivoId: idMotivo,
      comentarios: 'x'.repeat(REPORTE_COMENTARIO_MAX_LEN + 1),
    }).expect(400);
  });
});
