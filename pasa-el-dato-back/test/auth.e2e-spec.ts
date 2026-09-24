import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { calcularHashRefreshToken } from '../src/auth/refresh-token.js';
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

describe('Autenticación con PostgreSQL (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let idCuenta: string;

  // Un identificador aleatorio evita tocar cuentas creadas por otras personas.
  const correo = `auth.e2e.${randomUUID()}@duocuc.cl`;
  const run = `${Date.now()}${randomInt(100000, 999999)}-1`;
  const contrasena = 'clave-temporal-e2e';

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

    // Usamos referencias existentes, sin asumir IDs fijos.
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
      // Borra únicamente la cuenta identificada por el correo aleatorio.
      // PostgreSQL elimina su usuario y tokens en cascada.
      await prisma.cuenta.deleteMany({ where: { correo } });
    }
    if (app) {
      await app.close();
    }
  });

  it('inicia sesión, rota el token y registra éxitos y errores', async () => {
    const servidor = app.getHttpServer();
    const ultimoLog = await prisma.log_api.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const loginFallido = await request(servidor)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'contraseña-incorrecta' })
      .expect(401);
    expect(loginFallido.body.message).toBe('Credenciales inválidas');

    const login = await request(servidor)
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    expect(login.body.idCuenta).toBe(idCuenta);
    expect(login.body.usuario.rol.descripcion).toBe('Estudiante');
    expect(login.body).not.toHaveProperty('claveHash');

    const cookieAnterior = obtenerCookie(
      login.headers['set-cookie'],
      'refreshToken',
    );
    expect(cookieAnterior).toBeDefined();
    const tokenAnterior = cookieAnterior!.slice('refreshToken='.length);

    const renovacion = await request(servidor)
      .post('/api/auth/refresh')
      .set('Cookie', cookieAnterior!)
      .expect(200);
    expect(renovacion.body).toEqual({});

    const cookieNueva = obtenerCookie(
      renovacion.headers['set-cookie'],
      'refreshToken',
    );
    expect(cookieNueva).toBeDefined();
    expect(cookieNueva).not.toBe(cookieAnterior);

    const tokenViejoEnBd = await prisma.refreshToken.findUnique({
      where: { tokenHash: calcularHashRefreshToken(tokenAnterior) },
    });
    expect(tokenViejoEnBd?.fechaRevocacion).not.toBeNull();

    // Un refresh token revocado no puede utilizarse por segunda vez.
    await request(servidor)
      .post('/api/auth/refresh')
      .set('Cookie', cookieAnterior!)
      .expect(401);

    // Verificamos filas reales de log_api, no solo llamadas simuladas.
    const registros = await prisma.log_api.findMany({
      where: {
        id: { gt: ultimoLog?.id ?? 0n },
        OR: [
          { fk_cuenta: idCuenta },
          {
            fk_cuenta: null,
            ruta: { in: ['/api/auth/login', '/api/auth/refresh'] },
            mensaje_error: { in: ['Credenciales inválidas', 'Sesión inválida'] },
          },
        ],
      },
      orderBy: { id: 'desc' },
      take: 20,
    });
    expect(registros).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruta: '/api/auth/login',
          codigo_estado: 200,
          fk_cuenta: idCuenta,
          mensaje_error: null,
        }),
        expect.objectContaining({
          ruta: '/api/auth/refresh',
          codigo_estado: 200,
          fk_cuenta: idCuenta,
          mensaje_error: null,
        }),
        expect.objectContaining({
          ruta: '/api/auth/login',
          codigo_estado: 401,
          mensaje_error: 'Credenciales inválidas',
        }),
        expect.objectContaining({
          ruta: '/api/auth/refresh',
          codigo_estado: 401,
          mensaje_error: 'Sesión inválida',
        }),
      ]),
    );
  }, 30_000);
});
