import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';

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

describe('Listados de banners de marca y catálogo de marcas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let correoAdministrador: string;
  let correoEstudiante: string;
  let correoMarcaUno: string;
  let correoMarcaDos: string;
  let idCuentaMarcaUno: string;
  let idCuentaMarcaDos: string;
  let cookieAdministrador: string;
  let cookieMarcaUno: string;
  let idSede: number;

  const contrasenaAdministrador = 'admin-e2e-123';
  const contrasenaEstudiante = 'estudiante-e2e-123';
  const contrasenaMarca = 'marca-e2e-123';

  async function crearCuentaConRol(
    correo: string,
    contrasena: string,
    descripcionRol: string,
    run: string,
  ): Promise<void> {
    const [rol, sede, carrera] = await Promise.all([
      prisma.rolUsuario.findUnique({
        where: { descripcion: descripcionRol },
        select: { id: true },
      }),
      prisma.sede.findFirst({
        where: { activa: true },
        select: { id: true },
      }),
      prisma.carrera.findFirst({ select: { id: true } }),
    ]);

    if (!rol || !sede || !carrera) {
      throw new Error('El e2e requiere roles, una sede y una carrera');
    }

    const claveHash = await generarHashContrasena(contrasena);
    await prisma.cuenta.create({
      data: {
        correo,
        claveHash,
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run,
            pNombre: 'Usuario',
            pApellido: 'E2E',
            sApellido: descripcionRol,
            rol_usuario: { connect: { id: rol.id } },
            sede: { connect: { id: sede.id } },
            carrera: { connect: { id: carrera.id } },
          },
        },
      },
    });
  }

  async function iniciarSesion(
    ruta: '/api/auth/login' | '/api/auth/login-marca',
    correo: string,
    contrasena: string,
  ): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post(ruta)
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error(`No se recibió accessToken para ${correo}`);
    }

    return cookie;
  }

  async function crearBanner(
    idCuentaMarca: string,
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO',
    marcador: string,
    eliminado = false,
  ): Promise<string> {
    const banner = await prisma.bannerPublicidad.create({
      data: {
        fk_marca: idCuentaMarca,
        imagen: `/api/uploads/banner-${marcador}.png`,
        mensaje: `Banner ${marcador}`,
        fechaInicio: new Date('2026-01-01T00:00:00.000Z'),
        fechaFin: new Date('2026-12-31T23:59:59.000Z'),
        estado,
        eliminado,
        sedes: { create: [{ fk_sede: idSede }] },
      },
      select: { id: true },
    });

    return banner.id;
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

    const sede = await prisma.sede.findFirst({
      where: { activa: true },
      select: { id: true },
    });
    if (!sede) {
      throw new Error('El e2e requiere una sede activa');
    }
    idSede = sede.id;

    const sufijo = randomUUID();
    correoAdministrador = `admin.listados.${sufijo}@duocuc.cl`;
    correoEstudiante = `estudiante.listados.${sufijo}@duocuc.cl`;
    correoMarcaUno = `marca.uno.listados.${sufijo}@comercial.cl`;
    correoMarcaDos = `marca.dos.listados.${sufijo}@comercial.cl`;

    await crearCuentaConRol(
      correoAdministrador,
      contrasenaAdministrador,
      'Administrador',
      `${Date.now()}-1`,
    );

    await crearCuentaConRol(
      correoEstudiante,
      contrasenaEstudiante,
      'Estudiante',
      `${Date.now()}-2`,
    );

    cookieAdministrador = await iniciarSesion(
      '/api/auth/login',
      correoAdministrador,
      contrasenaAdministrador,
    );

    for (const [nombre, correo] of [
      ['Marca Listados Uno', correoMarcaUno],
      ['Marca Listados Dos', correoMarcaDos],
    ] as const) {
      const respuesta = await request(app.getHttpServer())
        .post('/api/admin/marcas')
        .set('Cookie', cookieAdministrador)
        .send({
          nombre,
          correo,
          telefono: '+56912345678',
          contrasenaInicial: contrasenaMarca,
        })
        .expect(201);

      if (correo === correoMarcaUno) {
        idCuentaMarcaUno = respuesta.body.idCuenta;
      } else {
        idCuentaMarcaDos = respuesta.body.idCuenta;
      }
    }

    cookieMarcaUno = await iniciarSesion(
      '/api/auth/login-marca',
      correoMarcaUno,
      contrasenaMarca,
    );
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.bannerPublicidad.deleteMany({
        where: { fk_marca: { in: [idCuentaMarcaUno, idCuentaMarcaDos] } },
      });
      await prisma.cuenta.deleteMany({
        where: {
          correo: {
            in: [
              correoAdministrador,
              correoEstudiante,
              correoMarcaUno,
              correoMarcaDos,
            ],
          },
        },
      });
    }

    if (app) {
      await app.close();
    }
  });

  describe('GET /api/publicidad/banners', () => {
    it('lista vacía para una marca sin banners', async () => {
      const respuesta = await request(app.getHttpServer())
        .get('/api/publicidad/banners')
        .set('Cookie', cookieMarcaUno)
        .expect(200);

      expect(respuesta.body).toEqual({ items: [], nextCursor: null });
    });

    it('lista todos los banners propios sin incluir los de otra marca ni los eliminados', async () => {
      const idEliminado = await crearBanner(
        idCuentaMarcaUno,
        'APROBADO',
        'propio-eliminado',
        true,
      );
      await crearBanner(idCuentaMarcaUno, 'PENDIENTE', 'propio-pendiente');
      await crearBanner(idCuentaMarcaUno, 'APROBADO', 'propio-aprobado');
      await crearBanner(idCuentaMarcaUno, 'RECHAZADO', 'propio-rechazado');
      await crearBanner(idCuentaMarcaDos, 'APROBADO', 'ajeno');

      const respuesta = await request(app.getHttpServer())
        .get('/api/publicidad/banners')
        .set('Cookie', cookieMarcaUno)
        .expect(200);

      expect(respuesta.body.items).toHaveLength(3);
      expect(
        respuesta.body.items.map(
          (banner: { id: string; estado: string }) => banner.estado,
        ),
      ).toEqual(
        expect.arrayContaining(['PENDIENTE', 'APROBADO', 'RECHAZADO']),
      );
      expect(respuesta.body.items.map((b: { id: string }) => b.id)).not.toContain(
        idEliminado,
      );

      for (const banner of respuesta.body.items) {
        expect(banner).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            imagen: expect.any(String),
            mensaje: expect.any(String),
            fechaInicio: expect.any(String),
            fechaFin: expect.any(String),
            estado: expect.any(String),
            sedes: [
              { id: idSede, nombre: expect.any(String) },
            ],
          }),
        );
      }
    });

    it('filtra por estado cuando se envía el parámetro', async () => {
      const respuesta = await request(app.getHttpServer())
        .get('/api/publicidad/banners?estado=RECHAZADO')
        .set('Cookie', cookieMarcaUno)
        .expect(200);

      expect(respuesta.body.items).toHaveLength(1);
      expect(respuesta.body.items[0].estado).toBe('RECHAZADO');
      expect(respuesta.body.items[0].mensaje).toBe(
        'Banner propio-rechazado',
      );
    });

    it('rechaza con 400 un estado inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/publicidad/banners?estado=ACTIVO')
        .set('Cookie', cookieMarcaUno)
        .expect(400);
    });
  });

  describe('GET /api/publicidad/banners/aprobados', () => {
    it('lista solo los banners aprobados de la marca', async () => {
      const respuesta = await request(app.getHttpServer())
        .get('/api/publicidad/banners/aprobados')
        .set('Cookie', cookieMarcaUno)
        .expect(200);

      expect(respuesta.body.items).toHaveLength(1);
      expect(respuesta.body.items[0].estado).toBe('APROBADO');
      expect(respuesta.body.items[0].mensaje).toBe(
        'Banner propio-aprobado',
      );
    });
  });

  describe('paginación por cursor', () => {
    it('respeta limit y entrega nextCursor encadenado', async () => {
      const paginaUno = await request(app.getHttpServer())
        .get('/api/publicidad/banners?limit=2')
        .set('Cookie', cookieMarcaUno)
        .expect(200);

      expect(paginaUno.body.items).toHaveLength(2);
      expect(paginaUno.body.nextCursor).toBe(
        paginaUno.body.items[1].id,
      );

      const paginaDos = await request(app.getHttpServer())
        .get(
          `/api/publicidad/banners?limit=2&cursor=${paginaUno.body.nextCursor}`,
        )
        .set('Cookie', cookieMarcaUno)
        .expect(200);

      expect(paginaDos.body.items).toHaveLength(1);
      expect(paginaDos.body.nextCursor).toBeNull();

      const ids = [
        ...paginaUno.body.items.map((b: { id: string }) => b.id),
        ...paginaDos.body.items.map((b: { id: string }) => b.id),
      ];
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('errores de los listados de banners', () => {
    it('rechaza con 403 una sesión sin rol Marca', async () => {
      const cookieEstudiante = await iniciarSesion(
        '/api/auth/login',
        correoEstudiante,
        contrasenaEstudiante,
      );

      await request(app.getHttpServer())
        .get('/api/publicidad/banners')
        .set('Cookie', cookieEstudiante)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/publicidad/banners/aprobados')
        .set('Cookie', cookieEstudiante)
        .expect(403);
    });

    it('rechaza con 401 sin sesión', async () => {
      await request(app.getHttpServer())
        .get('/api/publicidad/banners')
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/publicidad/banners/aprobados')
        .expect(401);
    });

    it('rechaza con 400 parámetros de paginación inválidos', async () => {
      await request(app.getHttpServer())
        .get('/api/publicidad/banners?limit=0')
        .set('Cookie', cookieMarcaUno)
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/publicidad/banners?limit=101')
        .set('Cookie', cookieMarcaUno)
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/publicidad/banners?cursor=no-es-uuid')
        .set('Cookie', cookieMarcaUno)
        .expect(400);
    });
  });

  describe('GET /api/admin/marcas', () => {
    it('lista todas las marcas ordenadas por nombre con su correo', async () => {
      const respuesta = await request(app.getHttpServer())
        .get('/api/admin/marcas')
        .set('Cookie', cookieAdministrador)
        .expect(200);

      expect(Array.isArray(respuesta.body)).toBe(true);
      expect(respuesta.body.length).toBeGreaterThanOrEqual(2);

      const nombres = respuesta.body.map(
        (marca: { nombre: string }) => marca.nombre,
      );
      expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b)));

      for (const marca of respuesta.body) {
        expect(marca).toEqual(
          expect.objectContaining({
            idCuenta: expect.any(String),
            nombre: expect.any(String),
            correo: expect.any(String),
          }),
        );
      }

      const correos = respuesta.body.map((m: { correo: string }) => m.correo);
      expect(correos).toEqual(
        expect.arrayContaining([correoMarcaUno, correoMarcaDos]),
      );
    });

    it('rechaza con 403 una sesión de estudiante', async () => {
      const cookieEstudiante = await iniciarSesion(
        '/api/auth/login',
        correoEstudiante,
        contrasenaEstudiante,
      );

      await request(app.getHttpServer())
        .get('/api/admin/marcas')
        .set('Cookie', cookieEstudiante)
        .expect(403);
    });

    it('rechaza con 401 sin sesión', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/marcas')
        .expect(401);
    });
  });
});
