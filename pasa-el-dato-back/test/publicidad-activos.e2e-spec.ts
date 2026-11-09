import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';
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

  return cookies
    .find((cookie) => cookie.startsWith(`${nombre}=`))
    ?.split(';')[0];
}

describe('HU-PU-05 listar banners activos por sede (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieUsuario: string;
  let idCuentaUsuario: string;
  let idCuentaMarca: string;
  let idSedeUsuario: number;
  let idOtraSede: number;

  const contrasenaUsuario = 'usuario-publicidad-activos-e2e-123';

  async function crearBanner(
    entrada: {
      sedeId?: number;
      fechaInicio?: Date;
      fechaFin?: Date;
      estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
      eliminado?: boolean;
      mensaje?: string;
    } = {},
  ) {
    return prisma.bannerPublicidad.create({
      data: {
        fk_marca: idCuentaMarca,
        imagen: '/api/uploads/banner-activo-e2e.png',
        mensaje: entrada.mensaje ?? 'Banner activo para e2e',
        fechaInicio: entrada.fechaInicio ?? new Date(Date.now() - 60_000),
        fechaFin: entrada.fechaFin ?? new Date(Date.now() + 86_400_000),
        estado: entrada.estado ?? 'APROBADO',
        eliminado: entrada.eliminado ?? false,
        sedes: {
          create: [{ fk_sede: entrada.sedeId ?? idSedeUsuario }],
        },
      },
      select: { id: true },
    });
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    prisma = modulo.get(PrismaService);

    const sedes = await prisma.sede.findMany({
      where: { activa: true, eliminado: false },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 2,
    });
    if (sedes.length < 2) {
      throw new Error('El e2e requiere al menos dos sedes activas');
    }
    idSedeUsuario = sedes[0].id;
    idOtraSede = sedes[1].id;

    const sufijo = randomUUID();
    const cuentaMarca = await prisma.cuenta.create({
      data: {
        correo: `marca.publicidad.activos.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena('marca-publicidad-activos-e2e-123'),
        telefono: '12345678',
        aprobada: true,
        marca: { create: { nombre: `Marca banners activos ${sufijo}` } },
      },
      select: { id_cuenta: true },
    });
    idCuentaMarca = cuentaMarca.id_cuenta;

    const cuentaUsuario = await prisma.cuenta.create({
      data: {
        correo: `usuario.publicidad.activos.${sufijo}@duocuc.cl`,
        claveHash: await generarHashContrasena(contrasenaUsuario),
        telefono: '12345678',
        aprobada: true,
        usuario: {
          create: {
            run: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            pNombre: 'Usuario',
            pApellido: 'Publicidad',
            sApellido: 'E2E',
            rol_usuario: { connect: { descripcion: 'Estudiante' } },
            sede: { connect: { id: idSedeUsuario } },
            carrera: { connect: { id: 1 } },
          },
        },
      },
      select: { id_cuenta: true, correo: true },
    });
    idCuentaUsuario = cuentaUsuario.id_cuenta;

    const respuestaLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: cuentaUsuario.correo,
        contrasena: contrasenaUsuario,
      })
      .expect(200);
    const cookie = obtenerCookie(
      respuestaLogin.headers['set-cookie'],
      'accessToken',
    );
    if (!cookie) {
      throw new Error('No se recibió accessToken para el usuario e2e');
    }
    cookieUsuario = cookie;
  });

  afterEach(async () => {
    if (idCuentaUsuario) {
      await prisma.usuario.update({
        where: { id_cuenta: idCuentaUsuario },
        data: { fk_sede: idSedeUsuario },
      });
    }
    await prisma.bannerPublicidad.deleteMany({
      where: { fk_marca: idCuentaMarca },
    });
  });

  afterAll(async () => {
    await prisma.log_api.deleteMany({
      where: { fk_cuenta: { in: [idCuentaUsuario, idCuentaMarca] } },
    });
    await prisma.cuenta.deleteMany({
      where: { id_cuenta: { in: [idCuentaUsuario, idCuentaMarca] } },
    });
    await app.close();
  });

  it('solo devuelve banners aprobados, vigentes, no eliminados y destinados a mi sede', async () => {
    const bannerVisible = await crearBanner({
      mensaje: 'Debe aparecer',
    });
    await crearBanner({
      sedeId: idOtraSede,
      mensaje: 'Otra sede',
    });
    await crearBanner({
      fechaInicio: new Date(Date.now() + 86_400_000),
      mensaje: 'Aún no vigente',
    });
    await crearBanner({
      fechaFin: new Date(Date.now() - 60_000),
      mensaje: 'Vigencia terminada',
    });
    await crearBanner({
      eliminado: true,
      mensaje: 'Eliminado',
    });
    await crearBanner({
      estado: 'PENDIENTE',
      mensaje: 'Pendiente',
    });
    await crearBanner({
      estado: 'RECHAZADO',
      mensaje: 'Rechazado',
    });

    const respuesta = await request(app.getHttpServer())
      .get('/api/publicidad/banners/activos')
      .set('Cookie', cookieUsuario)
      .expect(200);

    expect(respuesta.body.items).toEqual([
      expect.objectContaining({
        id: bannerVisible.id,
        imagenUrl: '/api/uploads/banner-activo-e2e.png',
        mensaje: 'Debe aparecer',
        marcaNombre: expect.stringContaining('Marca banners activos'),
      }),
    ]);
    expect(respuesta.body.nextCursor).toBeNull();
  });

  it('consulta la sede actual y deja de mostrar banners al cambiarla', async () => {
    await crearBanner();

    const antesDelCambio = await request(app.getHttpServer())
      .get('/api/publicidad/banners/activos')
      .set('Cookie', cookieUsuario)
      .expect(200);
    expect(antesDelCambio.body.items).toHaveLength(1);

    await prisma.usuario.update({
      where: { id_cuenta: idCuentaUsuario },
      data: { fk_sede: idOtraSede },
    });

    const despuesDelCambio = await request(app.getHttpServer())
      .get('/api/publicidad/banners/activos')
      .set('Cookie', cookieUsuario)
      .expect(200);
    expect(despuesDelCambio.body.items).toEqual([]);
    expect(despuesDelCambio.body.nextCursor).toBeNull();
  });

  it('pagina los banners con cursor sin repetir elementos', async () => {
    await Promise.all([
      crearBanner({ mensaje: 'Banner página A' }),
      crearBanner({ mensaje: 'Banner página B' }),
      crearBanner({ mensaje: 'Banner página C' }),
    ]);

    const primeraPagina = await request(app.getHttpServer())
      .get('/api/publicidad/banners/activos?limit=2')
      .set('Cookie', cookieUsuario)
      .expect(200);

    expect(primeraPagina.body.items).toHaveLength(2);
    expect(primeraPagina.body.nextCursor).toEqual(
      primeraPagina.body.items[1].id,
    );

    const segundaPagina = await request(app.getHttpServer())
      .get(
        `/api/publicidad/banners/activos?limit=2&cursor=${primeraPagina.body.nextCursor}`,
      )
      .set('Cookie', cookieUsuario)
      .expect(200);

    expect(segundaPagina.body.items).toHaveLength(1);
    expect(
      segundaPagina.body.items.some((item: { id: string }) =>
        primeraPagina.body.items.some(
          (anterior: { id: string }) => anterior.id === item.id,
        ),
      ),
    ).toBe(false);
    expect(segundaPagina.body.nextCursor).toBeNull();
  });

  it('requiere sesión y valida los parámetros de paginación', async () => {
    await request(app.getHttpServer())
      .get('/api/publicidad/banners/activos')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/publicidad/banners/activos?limit=101')
      .set('Cookie', cookieUsuario)
      .expect(400);

    await request(app.getHttpServer())
      .get('/api/publicidad/banners/activos?cursor=no-es-uuid')
      .set('Cookie', cookieUsuario)
      .expect(400);
  });
});
