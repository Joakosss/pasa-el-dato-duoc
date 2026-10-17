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

describe('POST /api/auth/logout con PostgreSQL (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let idCuenta: string;

  const correo = `logout.e2e.${randomUUID()}@duocuc.cl`;
  const run = `${Date.now()}${randomInt(100000, 999999)}-1`;
  const contrasena = 'clave-temporal-logout';

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
        where: { activa: true },
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
        pApellido: 'Temporal',
        sApellido: 'Logout',
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
      await prisma.accessTokenRevocado.deleteMany({
        where: { fk_cuenta: idCuenta },
      });
      await prisma.cuenta.deleteMany({ where: { correo } });
    }
    if (app) {
      await app.close();
    }
  });

  it('revoca solo la sesión actual, mantiene otro dispositivo e idempotente', async () => {
    const servidor = app.getHttpServer();

    const loginA = await request(servidor)
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);
    const loginB = await request(servidor)
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const accessA = obtenerCookie(loginA.headers['set-cookie'], 'accessToken')!;
    const refreshA = obtenerCookie(loginA.headers['set-cookie'], 'refreshToken')!;
    const accessB = obtenerCookie(loginB.headers['set-cookie'], 'accessToken')!;
    const refreshB = obtenerCookie(loginB.headers['set-cookie'], 'refreshToken')!;
    expect(accessA).toBeDefined();
    expect(refreshA).toBeDefined();
    expect(accessB).not.toBe(accessA);

    const decodificadoA = jwtService.decode<{ jti: string }>(
      accessA.slice('accessToken='.length),
    );
    const decodificadoB = jwtService.decode<{ jti: string }>(
      accessB.slice('accessToken='.length),
    );
    const jtiA = decodificadoA?.jti;
    const jtiB = decodificadoB?.jti;
    expect(jtiA).toBeDefined();
    expect(jtiB).toBeDefined();

    // Fila expirada que la purga perezosa del logout debe eliminar.
    await prisma.accessTokenRevocado.upsert({
      where: { jti: `expirado-${jtiA}` },
      update: { fechaExpiracion: new Date(Date.now() - 60_000) },
      create: {
        jti: `expirado-${jtiA}`,
        fk_cuenta: idCuenta,
        fechaExpiracion: new Date(Date.now() - 60_000),
      },
    });

    const logout = await request(servidor)
      .post('/api/auth/logout')
      .set('Cookie', [accessA, refreshA])
      .expect(200);
    expect(logout.body).toEqual({});
    const limpiadas = logout.headers['set-cookie'] as unknown as string[];
    expect(limpiadas.find((c) => c.startsWith('accessToken='))).toContain(
      'Path=/api',
    );
    expect(limpiadas.find((c) => c.startsWith('refreshToken='))).toContain(
      'Path=/api/auth',
    );

    // Verificación 1: copia del access revocado => 401.
    await request(servidor)
      .get('/api/auth/sesion')
      .set('Cookie', accessA)
      .expect(401);

    // Verificación 2: refresh reutilizado => 401.
    await request(servidor)
      .post('/api/auth/refresh')
      .set('Cookie', refreshA)
      .expect(401);

    // Verificación 3: otro dispositivo sigue vigente => 200.
    await request(servidor)
      .get('/api/auth/sesion')
      .set('Cookie', accessB)
      .expect(200);
    await request(servidor)
      .post('/api/auth/refresh')
      .set('Cookie', refreshB)
      .expect(200);

    // Verificación 4: solo jti actual en tabla, expirados purgados, sin tocar ajenas.
    const filas = await prisma.accessTokenRevocado.findMany({
      where: { fk_cuenta: idCuenta },
      select: { jti: true },
    });
    const jtis = filas.map((f) => f.jti);
    expect(jtis).toContain(jtiA);
    expect(jtis).not.toContain(jtiB);
    expect(jtis).not.toContain(`expirado-${jtiA}`);

    // Repetido idempotente => 200.
    await request(servidor)
      .post('/api/auth/logout')
      .set('Cookie', [accessA, refreshA])
      .expect(200);

    // Sin cookies => 200.
    await request(servidor).post('/api/auth/logout').expect(200);
  }, 30_000);
});
