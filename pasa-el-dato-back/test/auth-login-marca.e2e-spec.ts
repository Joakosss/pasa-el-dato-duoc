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

describe('POST /api/auth/login-marca (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let correoAdministrador: string;
  let correoEstudiante: string;
  let correoMarca: string;
  let cookieAdministrador: string;
  let refreshTokenMarca: string;

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
    correoAdministrador = `admin.login.marca.${sufijo}@duocuc.cl`;
    correoEstudiante = `estudiante.login.marca.${sufijo}@duocuc.cl`;
    correoMarca = `marca.login.${sufijo}@comercial.cl`;

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

    const respuestaAdmin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: correoAdministrador,
        contrasena: contrasenaAdministrador,
      })
      .expect(200);

    const cookieAdminObtenida = obtenerCookie(
      respuestaAdmin.headers['set-cookie'],
      'accessToken',
    );
    if (!cookieAdminObtenida) {
      throw new Error('No se recibió accessToken del administrador');
    }
    cookieAdministrador = cookieAdminObtenida;

    await request(app.getHttpServer())
      .post('/api/admin/marcas')
      .set('Cookie', cookieAdministrador)
      .send({
        nombre: 'Marca Login e2e',
        correo: correoMarca,
        telefono: '+56912345678',
        contrasenaInicial: contrasenaMarca,
      })
      .expect(201);
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

  it('autentica una cuenta de marca con correo comercial y entrega cookies', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: correoMarca, contrasena: contrasenaMarca })
      .expect(200);

    expect(respuesta.body).toEqual({
      idCuenta: expect.any(String),
      correo: correoMarca,
      marca: {
        nombre: 'Marca Login e2e',
        rol: { id: expect.any(Number), descripcion: 'Marca' },
      },
    });
    expect(respuesta.body).not.toHaveProperty('usuario');

    // supertest tipa set-cookie como string aunque en runtime es string[].
    const encabezado = respuesta.headers['set-cookie'];
    const cookies = Array.isArray(encabezado) ? encabezado : [encabezado];
    const access = cookies.find((cookie) =>
      cookie.startsWith('accessToken='),
    );
    const refresh = cookies.find((cookie) =>
      cookie.startsWith('refreshToken='),
    );

    expect(access).toMatch(/HttpOnly/i);
    expect(access).toContain('Path=/api');
    expect(refresh).toMatch(/HttpOnly/i);
    expect(refresh).toContain('Path=/api/auth');

    const refreshExtraido = obtenerCookie(cookies, 'refreshToken');
    if (!refreshExtraido) {
      throw new Error('No se recibió refreshToken del login-marca');
    }
    refreshTokenMarca = refreshExtraido;
  });

  it('normaliza el correo (espacios y mayúsculas)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({
        correo: `  ${correoMarca.toUpperCase()}  `,
        contrasena: contrasenaMarca,
      })
      .expect(200);
  });

  it('rechaza con 401 y mensaje genérico una contraseña incorrecta', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: correoMarca, contrasena: 'otra-clave-erronea' })
      .expect(401);

    expect(respuesta.body.message).toBe('Credenciales inválidas');
  });

  it('rechaza con 401 y mensaje genérico un correo inexistente', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: 'inexistente@comercial.cl', contrasena: 'clave123' })
      .expect(401);

    expect(respuesta.body.message).toBe('Credenciales inválidas');
  });

  it('rechaza con 401 una cuenta de estudiante y no crea refresh token huérfano', async () => {
    const antes = await prisma.refreshToken.count({
      where: { cuenta: { correo: correoEstudiante } },
    });

    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: correoEstudiante, contrasena: contrasenaEstudiante })
      .expect(401);

    expect(respuesta.body.message).toBe('Credenciales inválidas');

    const despues = await prisma.refreshToken.count({
      where: { cuenta: { correo: correoEstudiante } },
    });
    expect(despues).toBe(antes);
  });

  it('el estudiante sigue autenticando por el login general (sin regresión)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoEstudiante, contrasena: contrasenaEstudiante })
      .expect(200);
  });

  it('el login general sigue exigiendo correo institucional', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoMarca, contrasena: contrasenaMarca })
      .expect(400);

    const mensaje = Array.isArray(respuesta.body.message)
      ? respuesta.body.message.join(' ')
      : respuesta.body.message;
    expect(mensaje).toContain('@duocuc.cl');
  });

  it('rechaza con 403 una marca bloqueada', async () => {
    await prisma.cuenta.update({
      where: { correo: correoMarca },
      data: { bloqueado: true },
    });

    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: correoMarca, contrasena: contrasenaMarca })
      .expect(403);

    expect(respuesta.body.message).toBe('Cuenta bloqueada');

    await prisma.cuenta.update({
      where: { correo: correoMarca },
      data: { bloqueado: false },
    });
  });

  it('rechaza con 403 una marca inactiva (no aprobada)', async () => {
    await prisma.cuenta.update({
      where: { correo: correoMarca },
      data: { aprobada: false },
    });

    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: correoMarca, contrasena: contrasenaMarca })
      .expect(403);

    expect(respuesta.body.message).toBe('Cuenta inactiva');

    await prisma.cuenta.update({
      where: { correo: correoMarca },
      data: { aprobada: true },
    });
  });

  it('rechaza con 400 campos faltantes o correo mal formado', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ contrasena: 'clave123' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: correoMarca })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/login-marca')
      .send({ correo: 'no-es-un-correo', contrasena: 'clave123' })
      .expect(400);
  });

  it('la sesión del login-marca renueva y cierra con refresh y logout', async () => {
    expect(refreshTokenMarca).toBeTruthy();

    // refreshTokenMarca ya viene como "refreshToken=<valor>" de la cookie.
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenMarca)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', refreshTokenMarca)
      .expect(200);
  });
});
