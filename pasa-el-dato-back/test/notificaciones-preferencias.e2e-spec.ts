import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

function obtenerRunValido(): string {
  const numero = randomInt(10_000_000, 99_999_999);
  const digitos = String(numero)
    .split('')
    .reverse()
    .map(Number);
  const suma = digitos.reduce(
    (total, digito, indice) => total + digito * ([2, 3, 4, 5, 6, 7][indice % 6] ?? 2),
    0,
  );
  const resto = 11 - (suma % 11);
  const verificador = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

  return `${numero}-${verificador}`;
}

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

describe('Preferencias de notificaciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAcceso: string;
  let idCuenta: string;

  const correo = `no-pref-${randomUUID()}@duocuc.cl`;
  const run = obtenerRunValido();
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

    const registro = await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo,
        run,
        telefono: '12345678',
        contrasena,
        pNombre: 'Prueba',
        pApellido: 'Notificaciones',
        sApellido: 'Temporal',
        sedeId: sede.id,
        carreraId: carrera.id,
      });

    if (registro.status !== 201) {
      throw new Error(
        `No se pudo registrar la cuenta temporal (${registro.status}): ${JSON.stringify(registro.body)}`,
      );
    }

    const cuenta = await prisma.cuenta.findUnique({
      where: { correo },
      select: { id_cuenta: true },
    });

    if (!cuenta) {
      throw new Error('No se creó la cuenta temporal de prueba');
    }

    idCuenta = cuenta.id_cuenta;

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(login.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error('El login no entregó la cookie accessToken');
    }

    cookieAcceso = cookie;
  }, 30_000);

  afterAll(async () => {
    if (prisma && idCuenta) {
      await prisma.cuenta.delete({ where: { id_cuenta: idCuenta } });
    }

    if (app) {
      await app.close();
    }
  });

  it('consulta la preferencia inicial habilitada', async () => {
    await request(app.getHttpServer())
      .get('/api/notificaciones/preferencias')
      .set('Cookie', cookieAcceso)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ pushHabilitado: true });
      });
  });

  it('persiste la transición false y luego true', async () => {
    await request(app.getHttpServer())
      .patch('/api/notificaciones/preferencias')
      .set('Cookie', cookieAcceso)
      .send({ pushHabilitado: false })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ pushHabilitado: false });
      });

    const cuentaDeshabilitada = await prisma.cuenta.findUnique({
      where: { id_cuenta: idCuenta },
      select: { notificacionesPushHabilitadas: true },
    });
    expect(cuentaDeshabilitada?.notificacionesPushHabilitadas).toBe(false);

    await request(app.getHttpServer())
      .get('/api/notificaciones/preferencias')
      .set('Cookie', cookieAcceso)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ pushHabilitado: false });
      });

    await request(app.getHttpServer())
      .patch('/api/notificaciones/preferencias')
      .set('Cookie', cookieAcceso)
      .send({ pushHabilitado: true })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ pushHabilitado: true });
      });

    const cuentaHabilitada = await prisma.cuenta.findUnique({
      where: { id_cuenta: idCuenta },
      select: { notificacionesPushHabilitadas: true },
    });
    expect(cuentaHabilitada?.notificacionesPushHabilitadas).toBe(true);
  });

  it('rechaza consultar y actualizar sin sesión', async () => {
    await request(app.getHttpServer())
      .get('/api/notificaciones/preferencias')
      .expect(401);

    await request(app.getHttpServer())
      .patch('/api/notificaciones/preferencias')
      .send({ pushHabilitado: false })
      .expect(401);
  });

  it('rechaza un valor que no sea booleano', async () => {
    await request(app.getHttpServer())
      .patch('/api/notificaciones/preferencias')
      .set('Cookie', cookieAcceso)
      .send({ pushHabilitado: 'false' })
      .expect(400);

    const cuenta = await prisma.cuenta.findUnique({
      where: { id_cuenta: idCuenta },
      select: { notificacionesPushHabilitadas: true },
    });
    expect(cuenta?.notificacionesPushHabilitadas).toBe(true);
  });
});
