import {
  type INestApplication,
  ForbiddenException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';

describe('AuthController: login y renovación', () => {
  let app: INestApplication;
  const iniciarSesion = vi.fn();
  const renovarSesion = vi.fn();
  const crearLog = vi.fn().mockResolvedValue({});

  beforeAll(async () => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'secreto-de-prueba');
    vi.stubEnv('JWT_ACCESS_TTL_SECONDS', '900');
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '7');

    const modulo = await Test.createTestingModule({
      imports: [AuthModule],
    })
      // Esta prueba comprueba HTTP y cookies, sin conectarse a PostgreSQL.
      .overrideProvider(PrismaService)
      .useValue({ log_api: { create: crearLog } })
      .overrideProvider(AuthService)
      .useValue({ iniciarSesion, renovarSesion })
      .compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('registra la ruta y envía los tokens solo en cookies', async () => {
    const usuario = {
      idCuenta: 'uuid-cuenta',
      correo: 'alumno@duocuc.cl',
      usuario: {
        run: '12345678-5',
        pNombre: 'Ana',
        sNombre: null,
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        rol: { id: 1, descripcion: 'Estudiante' },
      },
    };
    iniciarSesion.mockResolvedValueOnce({
      usuario,
      accessToken: 'jwt-de-prueba',
      refreshToken: 'refresh-de-prueba',
    });

    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: ' ALUMNO@DUOCUC.CL ',
        contrasena: 'clave-correcta',
      })
      .expect(200);

    expect(iniciarSesion).toHaveBeenCalledWith({
      correo: 'alumno@duocuc.cl',
      contrasena: 'clave-correcta',
    });
    expect(respuesta.body).toEqual(usuario);
    expect(respuesta.headers['set-cookie']).toEqual([
      expect.stringContaining('accessToken=jwt-de-prueba'),
      expect.stringContaining('refreshToken=refresh-de-prueba'),
    ]);
    expect(respuesta.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(respuesta.headers['set-cookie'][1]).toContain('Max-Age=604800');
    expect(crearLog).toHaveBeenCalledWith({
      data: {
        metodo: 'POST',
        ruta: '/api/auth/login',
        codigo_estado: 200,
        mensaje_error: null,
        fk_cuenta: 'uuid-cuenta',
      },
    });
  });

  it('renueva ambas cookies sin poner los tokens en el cuerpo', async () => {
    renovarSesion.mockResolvedValueOnce({
      idCuenta: 'uuid-cuenta',
      accessToken: 'jwt-nuevo',
      refreshToken: 'refresh-nuevo',
    });

    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=refresh-viejo')
      .expect(200);

    expect(renovarSesion).toHaveBeenCalledWith('refresh-viejo');
    expect(respuesta.body).toEqual({});
    expect(respuesta.headers['set-cookie']).toEqual([
      expect.stringContaining('accessToken=jwt-nuevo'),
      expect.stringContaining('refreshToken=refresh-nuevo'),
    ]);
    expect(respuesta.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(respuesta.headers['set-cookie'][1]).toContain('HttpOnly');
    expect(crearLog).toHaveBeenCalledWith({
      data: {
        metodo: 'POST',
        ruta: '/api/auth/refresh',
        codigo_estado: 200,
        mensaje_error: null,
        fk_cuenta: 'uuid-cuenta',
      },
    });
  });

  it('rechaza la renovación cuando falta la cookie', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .expect(401);

    expect(renovarSesion).not.toHaveBeenCalled();
    expect(crearLog).toHaveBeenCalledWith({
      data: {
        metodo: 'POST',
        ruta: '/api/auth/refresh',
        codigo_estado: 401,
        mensaje_error: 'Sesión inválida',
        fk_cuenta: null,
      },
    });
  });

  it('registra el rechazo de credenciales sin guardar datos sensibles', async () => {
    iniciarSesion.mockRejectedValueOnce(
      new UnauthorizedException('Credenciales inválidas'),
    );

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo: 'alumno@duocuc.cl',
        contrasena: 'clave-secreta',
      })
      .expect(401);

    expect(crearLog).toHaveBeenCalledWith({
      data: {
        metodo: 'POST',
        ruta: '/api/auth/login',
        codigo_estado: 401,
        mensaje_error: 'Credenciales inválidas',
        fk_cuenta: null,
      },
    });
    expect(JSON.stringify(crearLog.mock.calls)).not.toContain('clave-secreta');
  });

  it('registra errores de validación antes de entrar al controlador', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: 'alumno@duocuc.cl' })
      .expect(400);

    expect(iniciarSesion).not.toHaveBeenCalled();
    expect(crearLog).toHaveBeenCalledWith({
      data: {
        metodo: 'POST',
        ruta: '/api/auth/login',
        codigo_estado: 400,
        mensaje_error: expect.any(String),
        fk_cuenta: null,
      },
    });
  });

  it('registra el bloqueo sin cambiar la respuesta 403', async () => {
    renovarSesion.mockRejectedValueOnce(
      new ForbiddenException('Cuenta bloqueada'),
    );

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=refresh-viejo')
      .expect(403);

    expect(crearLog).toHaveBeenCalledWith({
      data: {
        metodo: 'POST',
        ruta: '/api/auth/refresh',
        codigo_estado: 403,
        mensaje_error: 'Cuenta bloqueada',
        fk_cuenta: null,
      },
    });
  });

  it('documenta en Swagger la cookie y las respuestas de refresh', () => {
    const configuracion = new DocumentBuilder()
      .addCookieAuth('refreshToken', { type: 'apiKey' }, 'refreshToken')
      .build();
    const documento = SwaggerModule.createDocument(app, configuracion);
    const operacion = documento.paths['/api/auth/refresh']?.post;

    expect(operacion?.security).toEqual([{ refreshToken: [] }]);
    expect(operacion?.requestBody).toBeUndefined();
    expect(operacion?.responses).toHaveProperty('200');
    expect(operacion?.responses).toHaveProperty('401');
    expect(operacion?.responses).toHaveProperty('403');
  });
});
