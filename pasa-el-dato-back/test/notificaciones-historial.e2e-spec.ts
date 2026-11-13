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
    (total, digito, indice) =>
      total + digito * ([2, 3, 4, 5, 6, 7][indice % 6] ?? 2),
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

describe('Historial de notificaciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let cookieAcceso: string;
  let idCuenta: string;

  let cookieAccesoB: string;
  let idCuentaB: string;

  const correo = `no-historial-${randomUUID()}@duocuc.cl`;
  const run = obtenerRunValido();
  const contrasena = 'clave-temporal-e2e';

  const correoB = `no-historial-${randomUUID()}-b@duocuc.cl`;
  const runB = obtenerRunValido();
  const contrasenaB = 'clave-temporal-e2e';

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

    const registroA = await request(app.getHttpServer())
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

    if (registroA.status !== 201) {
      throw new Error(
        `No se pudo registrar la cuenta temporal A (${registroA.status}): ${JSON.stringify(registroA.body)}`,
      );
    }

    const registroB = await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo: correoB,
        run: runB,
        telefono: '12345678',
        contrasena: contrasenaB,
        pNombre: 'Prueba',
        pApellido: 'Notificaciones',
        sApellido: 'Temporal',
        sedeId: sede.id,
        carreraId: carrera.id,
      });

    if (registroB.status !== 201) {
      throw new Error(
        `No se pudo registrar la cuenta temporal B (${registroB.status}): ${JSON.stringify(registroB.body)}`,
      );
    }

    const [cuentaA, cuentaB] = await Promise.all([
      prisma.cuenta.findUnique({
        where: { correo },
        select: { id_cuenta: true },
      }),
      prisma.cuenta.findUnique({
        where: { correo: correoB },
        select: { id_cuenta: true },
      }),
    ]);

    if (!cuentaA || !cuentaB) {
      throw new Error('No se creó la cuenta temporal de prueba');
    }

    idCuenta = cuentaA.id_cuenta;
    idCuentaB = cuentaB.id_cuenta;

    const [loginA, loginB] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ correo, contrasena })
        .expect(200),
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ correo: correoB, contrasena: contrasenaB })
        .expect(200),
    ]);

    const cookieA = obtenerCookie(loginA.headers['set-cookie'], 'accessToken');
    if (!cookieA) {
      throw new Error('El login no entregó la cookie accessToken (A)');
    }
    cookieAcceso = cookieA;

    const cookieB = obtenerCookie(loginB.headers['set-cookie'], 'accessToken');
    if (!cookieB) {
      throw new Error('El login no entregó la cookie accessToken (B)');
    }
    cookieAccesoB = cookieB;
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      if (idCuenta) {
        await prisma.cuenta.delete({ where: { id_cuenta: idCuenta } });
      }
      if (idCuentaB) {
        await prisma.cuenta.delete({ where: { id_cuenta: idCuentaB } });
      }
    }

    if (app) {
      await app.close();
    }
  });

  it('rechaza consultar historial sin sesión', async () => {
    await request(app.getHttpServer()).get('/api/notificaciones').expect(401);
  });

  it('devuelve historial vacío al no tener notificaciones', async () => {
    await request(app.getHttpServer())
      .get('/api/notificaciones')
      .set('Cookie', cookieAcceso)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toEqual([]);
        expect(body.page).toBe(1);
        expect(body.pageSize).toBe(20);
        expect(body.total).toBe(0);
        expect(body.nextPage).toBeNull();
      });
  });

  it('lista ordenado por fecha desc y distingue leídas/no leídas', async () => {
    const base = {
      fk_cuenta: idCuenta,
      tipo: 'ADMIN_AVISO' as const,
    };

    const [antigua, media, reciente] = await Promise.all([
      prisma.notificacionUsuario.create({
        data: {
          ...base,
          mensaje: 'antigua',
          leida: true,
          fechaCreacion: new Date('2026-01-01T00:00:00.000Z'),
          dataJson: { origen: 'test', orden: 1 },
        },
      }),
      prisma.notificacionUsuario.create({
        data: {
          ...base,
          mensaje: 'media',
          leida: false,
          fechaCreacion: new Date('2026-02-01T00:00:00.000Z'),
          dataJson: { origen: 'test', orden: 2 },
        },
      }),
      prisma.notificacionUsuario.create({
        data: {
          ...base,
          mensaje: 'reciente',
          leida: false,
          fechaCreacion: new Date('2026-03-01T00:00:00.000Z'),
          dataJson: { origen: 'test', orden: 3 },
        },
      }),
    ]);

    await request(app.getHttpServer())
      .get('/api/notificaciones?page=1&pageSize=10')
      .set('Cookie', cookieAcceso)
      .expect(200)
      .expect(({ body }) => {
        const mensajes = body.items.map((item: any) => item.mensaje);
        expect(mensajes).toEqual(['reciente', 'media', 'antigua']);

        const itemMedia = body.items.find((item: any) => item.id === media.id);
        expect(itemMedia?.leida).toBe(false);

        const itemAntigua = body.items.find((item: any) => item.id === antigua.id);
        expect(itemAntigua?.leida).toBe(true);
      });

    await prisma.notificacionUsuario.deleteMany({
      where: { id: { in: [antigua.id, media.id, reciente.id] } },
    });
  });

  it('pagina resultados y devuelve nextPage cuando corresponde', async () => {
    const creadas = await Promise.all(
      Array.from({ length: 3 }).map((_, index) =>
        prisma.notificacionUsuario.create({
          data: {
            fk_cuenta: idCuenta,
            tipo: 'ADMIN_AVISO',
            mensaje: `paginacion-${index}`,
            fechaCreacion: new Date(`2026-04-0${index + 1}T00:00:00.000Z`),
            dataJson: { origen: 'test', pagina: true, index },
          },
        }),
      ),
    );

    const pagina1 = await request(app.getHttpServer())
      .get('/api/notificaciones?page=1&pageSize=2')
      .set('Cookie', cookieAcceso)
      .expect(200);

    expect(pagina1.body.items).toHaveLength(2);
    expect(pagina1.body.nextPage).toBe(2);

    const pagina2 = await request(app.getHttpServer())
      .get('/api/notificaciones?page=2&pageSize=2')
      .set('Cookie', cookieAcceso)
      .expect(200);

    expect(pagina2.body.items).toHaveLength(1);
    expect(pagina2.body.nextPage).toBeNull();

    await prisma.notificacionUsuario.deleteMany({
      where: { id: { in: creadas.map((item) => item.id) } },
    });
  });

  it('marca una notificación como leída de forma idempotente y persiste el estado', async () => {
    const notificacion = await prisma.notificacionUsuario.create({
      data: {
        fk_cuenta: idCuenta,
        tipo: 'ADMIN_AVISO',
        mensaje: 'marcar-leida',
        leida: false,
        dataJson: { origen: 'test', marcar: true },
      },
    });

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/notificaciones/${notificacion.id}/leida`)
      .set('Cookie', cookieAcceso)
      .expect(200);

    expect(respuesta.body.id).toBe(notificacion.id);
    expect(respuesta.body.leida).toBe(true);

    const persistida = await prisma.notificacionUsuario.findUnique({
      where: { id: notificacion.id },
    });
    expect(persistida?.leida).toBe(true);

    await request(app.getHttpServer())
      .patch(`/api/notificaciones/${notificacion.id}/leida`)
      .set('Cookie', cookieAcceso)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(notificacion.id);
        expect(body.leida).toBe(true);
      });

    await prisma.notificacionUsuario.delete({ where: { id: notificacion.id } });
  });

  it('no permite marcar como leída una notificación de otro usuario', async () => {
    const notificacionB = await prisma.notificacionUsuario.create({
      data: {
        fk_cuenta: idCuentaB,
        tipo: 'ADMIN_AVISO',
        mensaje: 'privada-b',
        leida: false,
        dataJson: { origen: 'test', cuenta: 'b' },
      },
    });

    await request(app.getHttpServer())
      .patch(`/api/notificaciones/${notificacionB.id}/leida`)
      .set('Cookie', cookieAcceso)
      .expect(403);

    await prisma.notificacionUsuario.delete({ where: { id: notificacionB.id } });
  });
});
