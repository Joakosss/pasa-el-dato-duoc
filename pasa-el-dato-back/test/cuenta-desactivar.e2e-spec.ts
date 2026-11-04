import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

describe('Cuenta propia - desactivación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let idCuenta: string;

  const correo = `cuenta.desactivar.e2e.${randomUUID()}@duocuc.cl`;
  const run = `${Date.now()}${randomInt(100000, 999999)}-1`;
  const contrasena = 'clave-temporal-cuenta-desactivar';

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
    jwtService = modulo.get(JwtService);

    const [sede, carrera] = await Promise.all([
      prisma.sede.findFirst({
        where: { activa: true, eliminado: false },
        select: { id: true },
      }),
      prisma.carrera.findFirst({ select: { id: true } }),
    ]);
    if (!sede || !carrera) {
      throw new Error('La prueba requiere una sede y una carrera existentes');
    }

    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo,
        run,
        telefono: '12345678',
        contrasena,
        pNombre: 'Prueba',
        pApellido: 'Cuenta',
        sApellido: 'E2E',
        sedeId: sede.id,
        carreraId: carrera.id,
      })
      .expect(201);

    const cuenta = await prisma.cuenta.findUnique({
      where: { correo },
      select: { id_cuenta: true },
    });
    if (!cuenta) {
      throw new Error('No se creó la cuenta temporal de prueba');
    }
    idCuenta = cuenta.id_cuenta;
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      await prisma.cuenta.deleteMany({ where: { correo } });
    }
    if (app) {
      await app.close();
    }
  });

  async function iniciarSesion(): Promise<{ access: string; refresh: string }> {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookieAccess = obtenerCookie(login.headers['set-cookie'], 'accessToken');
    const cookieRefresh = obtenerCookie(login.headers['set-cookie'], 'refreshToken');

    if (!cookieAccess || !cookieRefresh) {
      throw new Error('El login no entregó cookies accessToken/refreshToken');
    }

    return { access: cookieAccess, refresh: cookieRefresh };
  }

  it('401 sin sesión', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cuenta/me/desactivar')
      .send({ confirmacion: true })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('400 sin confirmación explícita', async () => {
    const { access, refresh } = await iniciarSesion();

    const respuesta = await request(app.getHttpServer())
      .post('/api/cuenta/me/desactivar')
      .set('Cookie', [access, refresh])
      .send({})
      .expect(400);

    expect(Array.isArray(respuesta.body.message)).toBe(true);
  });

  it('204 desactiva cuenta propia, limpia cookies y bloquea re-login', async () => {
    const servidor = app.getHttpServer();
    const { access, refresh } = await iniciarSesion();

    // Guardamos el jti del access actual para poder comprobar revocación.
    const token = access.slice('accessToken='.length);
    const payload = await jwtService.verifyAsync<{ jti: string; exp: number }>(token);

    const respuesta = await request(servidor)
      .post('/api/cuenta/me/desactivar')
      .set('Cookie', [access, refresh])
      .send({ confirmacion: true })
      .expect(204);

    // Debe limpiar cookies (set-cookie con expiración/clear).
    const setCookie = respuesta.headers['set-cookie'];
    expect(setCookie).toBeDefined();

    // Cuenta queda aprobada=false.
    const cuenta = await prisma.cuenta.findUniqueOrThrow({
      where: { id_cuenta: idCuenta },
      select: { aprobada: true },
    });
    expect(cuenta.aprobada).toBe(false);

    // Access token actual queda revocado.
    const revocado = await prisma.accessTokenRevocado.findUnique({
      where: { jti: payload.jti },
      select: { jti: true },
    });
    expect(revocado?.jti).toBe(payload.jti);

    // Login posterior se rechaza por cuenta inactiva.
    const login = await request(servidor)
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(403);

    expect(login.body.message).toBe('Cuenta inactiva');
  }, 30_000);
});
