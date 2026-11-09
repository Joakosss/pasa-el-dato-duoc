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

describe('HU-MAR-01 crear cuenta de marca (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let correoAdministrador: string;
  let correoEstudiante: string;
  let correoMarca: string;
  let cookieAdministrador: string;

  const contrasenaAdministrador = 'admin-e2e-123';
  const contrasenaEstudiante = 'estudiante-e2e-123';

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
    const cuenta = await prisma.cuenta.create({
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

    if (!cuenta.id_cuenta) {
      throw new Error('No se creó la cuenta de prueba');
    }
  }

  async function iniciarSesion(
    correo: string,
    contrasena: string,
  ): Promise<string> {
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
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = modulo.get(PrismaService);

    const sufijo = randomUUID();
    correoAdministrador = `admin.marca.${sufijo}@duocuc.cl`;
    correoEstudiante = `estudiante.marca.${sufijo}@duocuc.cl`;
    correoMarca = `marca.${sufijo}@comercial.cl`;

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
      correoAdministrador,
      contrasenaAdministrador,
    );
  });

  beforeEach(async () => {
    await prisma.cuenta.deleteMany({
      where: { correo: correoMarca },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.cuenta.deleteMany({
        where: {
          correo: {
            in: [correoAdministrador, correoEstudiante, correoMarca],
          },
        },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('crea una cuenta de marca activa, aprobada y con rol Marca', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/admin/marcas')
      .set('Cookie', cookieAdministrador)
      .send({
        nombre: 'Marca e2e',
        correo: correoMarca,
        telefono: '+56912345678',
        contrasenaInicial: 'marca-e2e-123',
      })
      .expect(201);

    expect(respuesta.body).toEqual({
      idCuenta: expect.any(String),
      nombre: 'Marca e2e',
      correo: correoMarca,
      telefono: '12345678',
      rol: 'Marca',
      aprobada: true,
      bloqueado: false,
    });
    expect(respuesta.body).not.toHaveProperty('claveHash');
    expect(respuesta.body).not.toHaveProperty('contrasenaInicial');

    const cuenta = await prisma.cuenta.findUnique({
      where: { correo: correoMarca },
      select: {
        aprobada: true,
        bloqueado: true,
        eliminado: true,
        claveHash: true,
        marca: { select: { nombre: true } },
      },
    });

    expect(cuenta).toMatchObject({
      aprobada: true,
      bloqueado: false,
      eliminado: false,
      marca: { nombre: 'Marca e2e' },
    });
    expect(cuenta?.claveHash).toMatch(/^\$argon2/);
  });

  it('rechaza con 409 un correo de marca ya registrado', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/marcas')
      .set('Cookie', cookieAdministrador)
      .send({
        nombre: 'Marca duplicada inicial',
        correo: correoMarca,
        telefono: '12345678',
        contrasenaInicial: 'marca-e2e-123',
      })
      .expect(201);

    const respuesta = await request(app.getHttpServer())
      .post('/api/admin/marcas')
      .set('Cookie', cookieAdministrador)
      .send({
        nombre: 'Otra marca',
        correo: correoMarca,
        telefono: '12345678',
        contrasenaInicial: 'marca-e2e-456',
      })
      .expect(409);

    expect(respuesta.body.message).toBe('El correo ya está registrado');
  });

  it('rechaza con 401 la creación sin sesión', async () => {
    await request(app.getHttpServer())
      .post('/api/admin/marcas')
      .send({
        nombre: 'Marca sin sesión',
        correo: correoMarca,
        telefono: '12345678',
        contrasenaInicial: 'marca-e2e-123',
      })
      .expect(401);
  });

  it('rechaza con 403 la creación para un usuario no administrador', async () => {
    const cookieEstudiante = await iniciarSesion(
      correoEstudiante,
      contrasenaEstudiante,
    );

    await request(app.getHttpServer())
      .post('/api/admin/marcas')
      .set('Cookie', cookieEstudiante)
      .send({
        nombre: 'Marca no autorizada',
        correo: correoMarca,
        telefono: '12345678',
        contrasenaInicial: 'marca-e2e-123',
      })
      .expect(403);
  });
});
