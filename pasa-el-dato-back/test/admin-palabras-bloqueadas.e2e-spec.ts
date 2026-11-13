import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';
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

  return cookies
    .find((cookie) => cookie.startsWith(`${nombre}=`))
    ?.split(';')[0];
}

describe('HU-ADM-05 palabras bloqueadas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAdministrador: string;
  let cookieEstudiante: string;
  let idAdministrador: string;
  let idEstudiante: string;
  let termino: string;
  let idPalabra: string;
  let idSede: number;

  const contrasenaAdministrador = 'admin-palabras-e2e-123';
  const contrasenaEstudiante = 'estudiante-palabras-e2e-123';

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

    if (!sede) {
      throw new Error('El e2e requiere una sede activa');
    }

    idSede = sede.id;
    const sufijo = randomUUID();
    termino = `termino-${sufijo}`;

    const administrador = await prisma.cuenta.create({
      data: {
        correo: `admin.palabras.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaAdministrador),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-palabras-admin`,
            pNombre: 'Admin',
            pApellido: 'Palabras',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Administrador' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idAdministrador = administrador.id_cuenta;

    const estudiante = await prisma.cuenta.create({
      data: {
        correo: `estudiante.palabras.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaEstudiante),
        telefono: '12345678',
        usuario: {
          create: {
            run: `${Date.now()}-palabras-estudiante`,
            pNombre: 'Estudiante',
            pApellido: 'Palabras',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSede } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idEstudiante = estudiante.id_cuenta;

    cookieAdministrador = await iniciarSesion(
      administrador.correo,
      contrasenaAdministrador,
    );
    cookieEstudiante = await iniciarSesion(
      estudiante.correo,
      contrasenaEstudiante,
    );
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    if (idPalabra) {
      await prisma.palabraBloqueada.deleteMany({
        where: { id: idPalabra },
      });
    }

    const idsCuentas = [idAdministrador, idEstudiante].filter(
      (id): id is string => Boolean(id),
    );
    if (idsCuentas.length > 0) {
      await prisma.cuenta.deleteMany({
        where: { id_cuenta: { in: idsCuentas } },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('rechaza acceso sin sesión y sin rol administrador', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/palabras-bloqueadas')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/palabras-bloqueadas')
      .set('Cookie', cookieEstudiante)
      .expect(403);
  });

  it('devuelve una lista vacía inicialmente (ignorando seeds)', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/admin/palabras-bloqueadas')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const items: Array<{ id: string; termino: string }> = respuesta.body ?? [];
    expect(items.filter((item) => item.termino === termino)).toEqual([]);
  });

  it('crea y lista un término con normalización exacta', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/admin/palabras-bloqueadas')
      .set('Cookie', cookieAdministrador)
      .send({ termino: `  ${termino.toUpperCase()}  ` })
      .expect(201);

    idPalabra = respuesta.body.id;
    expect(respuesta.body.termino).toBe(termino);

    const lista = await request(app.getHttpServer())
      .get('/api/admin/palabras-bloqueadas')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const items: Array<{ id: string; termino: string }> = lista.body ?? [];
    expect(items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: idPalabra, termino })]),
    );
  });

  it('rechaza términos duplicados normalizados con conflicto', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/palabras-bloqueadas')
      .set('Cookie', cookieAdministrador)
      .send({ termino: ` ${termino.toUpperCase()} ` })
      .expect(409);
  });

  it('mantiene coincidencia exacta sin variantes internas', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/admin/palabras-bloqueadas')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const items: Array<{ id: string; termino: string }> = respuesta.body ?? [];
    expect(items).toEqual(expect.arrayContaining([expect.objectContaining({ termino })]));
  });

  it('elimina el término y deja la lista vacía', async () => {
    await request(app.getHttpServer())
      .delete(`/api/admin/palabras-bloqueadas/${idPalabra}`)
      .set('Cookie', cookieAdministrador)
      .expect(204);

    const lista = await request(app.getHttpServer())
      .get('/api/admin/palabras-bloqueadas')
      .set('Cookie', cookieAdministrador)
      .expect(200);

    const items: Array<{ id: string; termino: string }> = lista.body ?? [];
    expect(items.filter((item) => item.termino === termino)).toEqual([]);
  });

  it('rechaza un id de eliminación inexistente', async () => {
    await request(app.getHttpServer())
      .delete(`/api/admin/palabras-bloqueadas/${randomUUID()}`)
      .set('Cookie', cookieAdministrador)
      .expect(404);
  });
});
