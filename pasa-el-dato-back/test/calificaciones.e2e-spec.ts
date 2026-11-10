import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';

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

describe('HU-CAL-01 Calificaciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let cookieVendedor: string;
  let cookieComprador: string;
  let cookieTercero: string;

  let idCuentaVendedor: string;
  let idCuentaComprador: string;
  let idCuentaTercero: string;

  let idPublicacion: string;

  const contrasena = 'clave-temporal-calificacion';
  const correoVendedor = `calif.vendedor.${randomUUID()}@duocuc.cl`;
  const correoComprador = `calif.comprador.${randomUUID()}@duocuc.cl`;
  const correoTercero = `calif.tercero.${randomUUID()}@duocuc.cl`;
  const runVendedor = `${Date.now()}${randomInt(100000, 999999)}-1`;
  const runComprador = `${Date.now()}${randomInt(100000, 999999)}-2`;
  const runTercero = `${Date.now()}${randomInt(100000, 999999)}-3`;

  let sedeActivaId: number;

  async function registrarCuenta(correoCuenta: string, runCuenta: string): Promise<void> {
    const carrera = await prisma.carrera.findFirst({ select: { id: true } });
    if (!carrera) {
      throw new Error('La prueba requiere una carrera existente');
    }

    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo: correoCuenta,
        run: runCuenta,
        telefono: '91234567',
        contrasena,
        pNombre: 'Prueba',
        pApellido: 'Calificacion',
        sApellido: 'E2E',
        sedeId: sedeActivaId,
        carreraId: carrera.id,
      })
      .expect(201);
  }

  async function iniciarSesion(correoCuenta: string): Promise<string> {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCuenta, contrasena })
      .expect(200);

    const cookie = obtenerCookie(loginRes.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error('El login no entregó la cookie accessToken');
    }
    return cookie;
  }

  const firmaPngValida = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
  ]);

  function requestCrearPublicacionValida(cookie: string) {
    return request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookie)
      .field('titulo', 'Publicación para calificar')
      .field(
        'descripcion',
        'Descripción suficientemente larga para cumplir validaciones (calificaciones).',
      )
      .field('precio', '12345')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '1')
      .field('categoriaId', '1')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      });
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

    const sedeActiva = await prisma.sede.findFirst({
      where: { activa: true, eliminado: false },
      select: { id: true },
    });
    if (!sedeActiva) {
      throw new Error('La prueba requiere una sede activa existente');
    }
    sedeActivaId = sedeActiva.id;

    await registrarCuenta(correoVendedor, runVendedor);
    await registrarCuenta(correoComprador, runComprador);
    await registrarCuenta(correoTercero, runTercero);

    [cookieVendedor, cookieComprador, cookieTercero] = await Promise.all([
      iniciarSesion(correoVendedor),
      iniciarSesion(correoComprador),
      iniciarSesion(correoTercero),
    ]);

    const cuentaVendedor = await prisma.cuenta.findUnique({
      where: { correo: correoVendedor },
      select: { id_cuenta: true },
    });
    const cuentaComprador = await prisma.cuenta.findUnique({
      where: { correo: correoComprador },
      select: { id_cuenta: true },
    });
    const cuentaTercero = await prisma.cuenta.findUnique({
      where: { correo: correoTercero },
      select: { id_cuenta: true },
    });

    if (!cuentaVendedor || !cuentaComprador || !cuentaTercero) {
      throw new Error('No se pudieron resolver ids de cuentas');
    }

    idCuentaVendedor = cuentaVendedor.id_cuenta;
    idCuentaComprador = cuentaComprador.id_cuenta;
    idCuentaTercero = cuentaTercero.id_cuenta;

    // Publicación del vendedor
    const pubRes = await requestCrearPublicacionValida(cookieVendedor).expect(201);
    idPublicacion = pubRes.body.id;

    // Asegurar estados (siempre existen por seed, pero se deja robusto)
    await prisma.estadoPublicacion.upsert({
      where: { descripcion: 'En curso' },
      update: {},
      create: { descripcion: 'En curso' },
    });
    await prisma.estadoPublicacion.upsert({
      where: { descripcion: 'Vendida' },
      update: {},
      create: { descripcion: 'Vendida' },
    });

    // Cierre de venta: registra comprador + pone estado Vendida (HU-COM-01)
    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: idCuentaComprador })
      .expect(200);
  }, 60_000);

  afterAll(async () => {
    if (prisma) {
      if (idPublicacion) {
        await prisma.calificacion.deleteMany({ where: { fk_publicacion: idPublicacion } });
        await prisma.imagenPublicacion.deleteMany({ where: { fk_publicacion: idPublicacion } });
        await prisma.publicacion.deleteMany({ where: { id: idPublicacion } });
      }

      await prisma.cuenta.deleteMany({
        where: { correo: { in: [correoVendedor, correoComprador, correoTercero] } },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('C1: comprador califica al vendedor (201)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/calificaciones`)
      .set('Cookie', cookieComprador)
      .send({ puntaje: 5 })
      .expect(201);

    expect(res.body).toMatchObject({
      publicacionId: idPublicacion,
      emisorId: idCuentaComprador,
      receptorId: idCuentaVendedor,
      puntaje: 5,
    });
    expect(typeof res.body.id).toBe('string');
  });

  it('C2: vendedor califica al comprador (201)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/calificaciones`)
      .set('Cookie', cookieVendedor)
      .send({ puntaje: 4, comentario: 'OK' })
      .expect(201);

    expect(res.body).toMatchObject({
      publicacionId: idPublicacion,
      emisorId: idCuentaVendedor,
      receptorId: idCuentaComprador,
      puntaje: 4,
      comentario: 'OK',
    });
  });

  it('C3: no participante no puede calificar (403)', async () => {
    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/calificaciones`)
      .set('Cookie', cookieTercero)
      .send({ puntaje: 5 })
      .expect(403);
  });

  it('C4: duplicado por dirección es 409', async () => {
    // Comprador ya calificó al vendedor en C1
    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/calificaciones`)
      .set('Cookie', cookieComprador)
      .send({ puntaje: 3 })
      .expect(409);
  });

  it('C5: puntaje fuera de rango es 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/calificaciones`)
      .set('Cookie', cookieVendedor)
      .send({ puntaje: 6 })
      .expect(400);
  });

  it('HU-CAL-02 BE01: obtiene promedio y total de calificaciones recibidas', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/perfil/${idCuentaVendedor}/reputacion`)
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(respuesta.body).toEqual({
      usuarioId: idCuentaVendedor,
      promedio: 5,
      total: 1,
    });
  });

  it('HU-CAL-02 BE02: lista calificaciones recibidas ordenadas y paginadas', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/perfil/${idCuentaVendedor}/calificaciones`)
      .query({ page: 1, pageSize: 10 })
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      nextPage: null,
    });
    expect(respuesta.body.items).toHaveLength(1);
    expect(respuesta.body.items[0]).toMatchObject({
      publicacionId: idPublicacion,
      puntaje: 5,
      comentario: null,
    });
    expect(typeof respuesta.body.items[0].id).toBe('string');
    expect(typeof respuesta.body.items[0].fechaCreacion).toBe('string');
  });

  it('HU-CAL-02 BE05: responde sin calificaciones sin error', async () => {
    const [resumen, listado] = await Promise.all([
      request(app.getHttpServer())
        .get(`/api/perfil/${idCuentaTercero}/reputacion`)
        .set('Cookie', cookieComprador),
      request(app.getHttpServer())
        .get(`/api/perfil/${idCuentaTercero}/calificaciones`)
        .set('Cookie', cookieComprador),
    ]);

    expect(resumen.status).toBe(200);
    expect(resumen.body).toEqual({
      usuarioId: idCuentaTercero,
      promedio: null,
      total: 0,
    });

    expect(listado.status).toBe(200);
    expect(listado.body).toMatchObject({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      nextPage: null,
    });
  });

  it('HU-CAL-02 BE04: exige autenticación para resumen y listado', async () => {
    await request(app.getHttpServer())
      .get(`/api/perfil/${idCuentaVendedor}/reputacion`)
      .expect(401);

    await request(app.getHttpServer())
      .get(`/api/perfil/${idCuentaVendedor}/calificaciones`)
      .expect(401);
  });

  it('HU-CAL-02 BE06: valida usuario inexistente y paginación inválida', async () => {
    await request(app.getHttpServer())
      .get(`/api/perfil/${randomUUID()}/reputacion`)
      .set('Cookie', cookieComprador)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/perfil/${idCuentaVendedor}/calificaciones`)
      .query({ page: 0 })
      .set('Cookie', cookieComprador)
      .expect(400);
  });
});
