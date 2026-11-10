import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

describe('HU-FAV-01/02 (e2e) - Favoritos', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieA: string;
  let cookieB: string;

  const contrasena = 'clave-temporal-favoritos';
  const correoA = `favoritos.e2e.a.${randomUUID()}@duocuc.cl`;
  const runA = `${Date.now()}${randomInt(100000, 999999)}-1`;
  const correoB = `favoritos.e2e.b.${randomUUID()}@duocuc.cl`;
  const runB = `${Date.now()}${randomInt(100000, 999999)}-2`;
  const publicacionesCreadasIds = new Set<string>();

  async function registrarCuenta(
    correoCuenta: string,
    runCuenta: string,
    sedeActivaId: number,
  ): Promise<void> {
    const carrera = await prisma.carrera.findFirst({
      select: { id: true },
    });
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
        pApellido: 'Favoritos',
        sApellido: 'E2E',
        sedeId: sedeActivaId,
        carreraId: carrera.id,
      })
      .expect(201);
  }

  async function iniciarSesion(correoCuenta: string): Promise<string> {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCuenta, contrasena })
      .expect(200);

    const cookie = obtenerCookie(login.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error('El login no entregó la cookie accessToken');
    }

    return cookie;
  }

  async function obtenerCuentaId(correoCuenta: string): Promise<string> {
    const cuenta = await prisma.cuenta.findUnique({
      where: { correo: correoCuenta },
      select: { id_cuenta: true },
    });
    if (!cuenta) {
      throw new Error(`No se encontró la cuenta de prueba ${correoCuenta}`);
    }

    return cuenta.id_cuenta;
  }

  async function crearPublicacion(
    propietarioId: string,
    estadoDescripcion = 'En curso',
  ): Promise<string> {
    const sede = await prisma.sede.findFirst({
      where: { eliminado: false, activa: true },
      select: { id: true },
    });
    const tipoVenta = await prisma.tipoVenta.findFirst({ select: { id: true } });
    const categoria = await prisma.categoria.findFirst({ select: { id: true } });
    const estado = await prisma.estadoPublicacion.findUnique({
      where: { descripcion: estadoDescripcion },
      select: { id: true },
    });

    if (!sede || !tipoVenta || !categoria || !estado) {
      throw new Error('La prueba requiere catálogos de publicación completos');
    }

    const publicacion = await prisma.publicacion.create({
      data: {
        titulo: `Publicación favoritos ${randomUUID()}`,
        descripcion: 'Publicación de prueba',
        precio: 1000,
        fk_estado_publicacion: estado.id,
        fk_tipoventa: tipoVenta.id,
        fk_categoria: categoria.id,
        fk_usuario: propietarioId,
        fk_sede: sede.id,
      },
      select: { id: true },
    });
    publicacionesCreadasIds.add(publicacion.id);
    return publicacion.id;
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

    await registrarCuenta(correoA, runA, sedeActiva.id);
    await registrarCuenta(correoB, runB, sedeActiva.id);

    cookieA = await iniciarSesion(correoA);
    cookieB = await iniciarSesion(correoB);
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      if (publicacionesCreadasIds.size > 0) {
        const ids = [...publicacionesCreadasIds];
        await prisma.publicacion.deleteMany({
          where: { id: { in: ids } },
        });
      }

      await prisma.cuenta.deleteMany({
        where: { correo: { in: [correoA, correoB] } },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('F1: rechaza marcar favorito sin sesión (401)', async () => {
    await request(app.getHttpServer())
      .post(`/api/favoritos/${randomUUID()}`)
      .expect(401);
  });

  it('F2: marca y quita favorito; es idempotente y persiste estado (GET)', async () => {
    const cuentaA = await prisma.cuenta.findUnique({
      where: { correo: correoA },
      select: { id_cuenta: true },
    });
    expect(cuentaA).not.toBeNull();

    const sede = await prisma.sede.findFirst({
      where: { eliminado: false, activa: true },
      select: { id: true },
    });
    const tipoVenta = await prisma.tipoVenta.findFirst({ select: { id: true } });
    const categoria = await prisma.categoria.findFirst({ select: { id: true } });
    const estadoEnCurso = await prisma.estadoPublicacion.findFirst({
      where: { descripcion: 'En curso' },
      select: { id: true },
    });

    expect(sede).not.toBeNull();
    expect(tipoVenta).not.toBeNull();
    expect(categoria).not.toBeNull();
    expect(estadoEnCurso).not.toBeNull();

    const publicacion = await prisma.publicacion.create({
      data: {
        titulo: 'Publicación para HU-FAV-01',
        descripcion: 'desc',
        precio: 1000,
        fk_estado_publicacion: estadoEnCurso!.id,
        fk_tipoventa: tipoVenta!.id,
        fk_categoria: categoria!.id,
        fk_usuario: cuentaA!.id_cuenta,
        fk_sede: sede!.id,
      },
      select: { id: true },
    });
    publicacionesCreadasIds.add(publicacion.id);

    // Estado inicial: no favorito
    const estado0 = await request(app.getHttpServer())
      .get(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(200);
    expect(estado0.body).toEqual({ publicacionId: publicacion.id, esFavorito: false });

    // Marcar favorito
    const marcado = await request(app.getHttpServer())
      .post(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(201);
    expect(marcado.body).toEqual({ publicacionId: publicacion.id, esFavorito: true });

    // Persistencia (GET)
    const estado1 = await request(app.getHttpServer())
      .get(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(200);
    expect(estado1.body).toEqual({ publicacionId: publicacion.id, esFavorito: true });

    // POST repetido (no debe duplicar; sigue true)
    const marcado2 = await request(app.getHttpServer())
      .post(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(201);
    expect(marcado2.body).toEqual({ publicacionId: publicacion.id, esFavorito: true });

    // Quitar favorito
    const quitado = await request(app.getHttpServer())
      .delete(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(200);
    expect(quitado.body).toEqual({ publicacionId: publicacion.id, esFavorito: false });

    // DELETE repetido idempotente
    const quitado2 = await request(app.getHttpServer())
      .delete(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(200);
    expect(quitado2.body).toEqual({ publicacionId: publicacion.id, esFavorito: false });

    // POST luego de quitar: reactiva
    const marcado3 = await request(app.getHttpServer())
      .post(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(201);
    expect(marcado3.body).toEqual({ publicacionId: publicacion.id, esFavorito: true });

    // Deja aisladas las pruebas del listado que se ejecutan a continuación.
    await request(app.getHttpServer())
      .delete(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieB)
      .expect(200);
  }, 30_000);

  it('F3: rechaza marcar favorita propia publicación (400)', async () => {
    const cuentaA = await prisma.cuenta.findUnique({
      where: { correo: correoA },
      select: { id_cuenta: true },
    });

    expect(cuentaA).not.toBeNull();

    const sede = await prisma.sede.findFirst({
      where: { eliminado: false, activa: true },
      select: { id: true },
    });
    const tipoVenta = await prisma.tipoVenta.findFirst({ select: { id: true } });
    const categoria = await prisma.categoria.findFirst({ select: { id: true } });
    const estadoEnCurso = await prisma.estadoPublicacion.findFirst({
      where: { descripcion: 'En curso' },
      select: { id: true },
    });

    expect(sede).not.toBeNull();
    expect(tipoVenta).not.toBeNull();
    expect(categoria).not.toBeNull();
    expect(estadoEnCurso).not.toBeNull();

    const publicacion = await prisma.publicacion.create({
      data: {
        titulo: 'Publicación propia HU-FAV-01',
        descripcion: 'desc',
        precio: 1000,
        fk_estado_publicacion: estadoEnCurso!.id,
        fk_tipoventa: tipoVenta!.id,
        fk_categoria: categoria!.id,
        fk_usuario: cuentaA!.id_cuenta,
        fk_sede: sede!.id,
      },
      select: { id: true },
    });
    publicacionesCreadasIds.add(publicacion.id);

    await request(app.getHttpServer())
      .post(`/api/favoritos/${publicacion.id}`)
      .set('Cookie', cookieA)
      .expect(400);
  }, 30_000);

  it('F4: requiere sesión para listar mis favoritos', async () => {
    await request(app.getHttpServer()).get('/api/favoritos').expect(401);
  });

  it('F4.1: Swagger describe el endpoint, paginación y autenticación por cookie', () => {
    const configuracion = new DocumentBuilder()
      .setTitle('Pruebas')
      .setVersion('1.0')
      .addCookieAuth('accessToken', { type: 'apiKey' }, 'accessToken')
      .build();
    const documento = SwaggerModule.createDocument(app, configuracion);
    const operacion = documento.paths['/api/favoritos']?.get;

    expect(operacion).toBeDefined();
    expect(operacion?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'page', in: 'query' }),
        expect.objectContaining({ name: 'pageSize', in: 'query' }),
      ]),
    );
    expect(operacion?.security).toEqual(
      expect.arrayContaining([expect.objectContaining({ accessToken: [] })]),
    );
    expect(operacion?.responses?.['200']).toBeDefined();
  });

  it('F5: lista solo favoritos propios y conserva publicaciones no disponibles', async () => {
    const idCuentaA = await obtenerCuentaId(correoA);
    const idCuentaB = await obtenerCuentaId(correoB);
    const disponibleId = await crearPublicacion(idCuentaA);
    const pausadaId = await crearPublicacion(idCuentaA, 'Pausada');
    const eliminadaId = await crearPublicacion(idCuentaA);

    await prisma.publicacion.update({
      where: { id: eliminadaId },
      data: { eliminado: true },
    });

    await prisma.favorito.createMany({
      data: [disponibleId, pausadaId, eliminadaId].map((publicacionId) => ({
        fk_publicacion: publicacionId,
        fk_usuario: idCuentaB,
      })),
    });

    const respuestaB = await request(app.getHttpServer())
      .get('/api/favoritos')
      .set('Cookie', cookieB)
      .expect(200);

    expect(respuestaB.body).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 3,
      nextPage: null,
    });
    expect(respuestaB.body.items).toHaveLength(3);

    const porId = new Map(
      respuestaB.body.items.map((item: { id: string; disponible: boolean }) => [
        item.id,
        item,
      ]),
    );
    expect(porId.get(disponibleId)).toMatchObject({
      id: disponibleId,
      titulo: expect.any(String),
      precio: 1000,
      estado: { descripcion: 'En curso' },
      sede: { nombre: expect.any(String) },
      tipoVenta: { nombre: expect.any(String) },
      categoria: { nombre: expect.any(String) },
      imagenes: [],
      disponible: true,
    });
    expect(porId.get(pausadaId)).toMatchObject({
      estado: { descripcion: 'Pausada' },
      disponible: false,
    });
    expect(porId.get(eliminadaId)).toMatchObject({ disponible: false });

    const respuestaA = await request(app.getHttpServer())
      .get('/api/favoritos')
      .set('Cookie', cookieA)
      .expect(200);
    expect(respuestaA.body.items).toEqual([]);
    expect(respuestaA.body.total).toBe(0);
  });

  it('F6: devuelve lista vacía con paginación y rechaza parámetros inválidos', async () => {
    const idCuentaA = await obtenerCuentaId(correoA);
    const publicacionId = await crearPublicacion(idCuentaA);
    const cuentaSinFavoritos = await prisma.cuenta.findUnique({
      where: { correo: correoA },
      select: { id_cuenta: true },
    });
    expect(cuentaSinFavoritos).not.toBeNull();

    const vacio = await request(app.getHttpServer())
      .get('/api/favoritos')
      .set('Cookie', cookieA)
      .expect(200);
    expect(vacio.body).toMatchObject({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      nextPage: null,
    });

    for (const query of ['page=0', 'page=abc', 'pageSize=15', 'pageSize=abc']) {
      await request(app.getHttpServer())
        .get(`/api/favoritos?${query}`)
        .set('Cookie', cookieA)
        .expect(400);
    }

    // La publicación existe para asegurar que los errores provienen de la
    // validación de query y no de una fixture incompleta.
    expect(publicacionesCreadasIds.has(publicacionId)).toBe(true);
  });

  it('F7: pagina en tamaños 20 y 10 sin repetir publicaciones', async () => {
    const idCuentaA = await obtenerCuentaId(correoA);
    const idCuentaB = await obtenerCuentaId(correoB);
    const ids = await Promise.all(
      Array.from({ length: 21 }, () => crearPublicacion(idCuentaA)),
    );

    await prisma.favorito.createMany({
      data: ids.map((publicacionId) => ({
        fk_publicacion: publicacionId,
        fk_usuario: idCuentaB,
      })),
    });

    const webPagina1 = await request(app.getHttpServer())
      .get('/api/favoritos?page=1&pageSize=20')
      .set('Cookie', cookieB)
      .expect(200);
    const webPagina2 = await request(app.getHttpServer())
      .get('/api/favoritos?page=2&pageSize=20')
      .set('Cookie', cookieB)
      .expect(200);

    expect(webPagina1.body.items).toHaveLength(20);
    expect(webPagina1.body.total).toBe(24);
    expect(webPagina1.body.nextPage).toBe(2);
    expect(webPagina2.body.items).toHaveLength(4);
    expect(webPagina2.body.nextPage).toBeNull();

    const mobilePagina1 = await request(app.getHttpServer())
      .get('/api/favoritos?page=1&pageSize=10')
      .set('Cookie', cookieB)
      .expect(200);
    const mobilePagina2 = await request(app.getHttpServer())
      .get('/api/favoritos?page=2&pageSize=10')
      .set('Cookie', cookieB)
      .expect(200);
    const mobilePagina3 = await request(app.getHttpServer())
      .get('/api/favoritos?page=3&pageSize=10')
      .set('Cookie', cookieB)
      .expect(200);

    expect(mobilePagina1.body.items).toHaveLength(10);
    expect(mobilePagina2.body.items).toHaveLength(10);
    expect(mobilePagina3.body.items).toHaveLength(4);

    const vistos = [
      ...webPagina1.body.items,
      ...webPagina2.body.items,
    ].map((item: { id: string }) => item.id);
    expect(new Set(vistos).size).toBe(vistos.length);
    expect(vistos).toHaveLength(24);
    for (const id of ids) {
      expect(vistos).toContain(id);
    }
  }, 30_000);
});
