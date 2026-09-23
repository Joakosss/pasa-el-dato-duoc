import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';

describe('AuthController: POST /api/auth/login', () => {
  let app: INestApplication;
  const iniciarSesion = vi.fn();

  beforeAll(async () => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'secreto-de-prueba');
    vi.stubEnv('JWT_ACCESS_TTL_SECONDS', '900');
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '7');

    const modulo = await Test.createTestingModule({
      imports: [AuthModule],
    })
      // Esta prueba comprueba HTTP y cookies, sin conectarse a PostgreSQL.
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(AuthService)
      .useValue({ iniciarSesion })
      .compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
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
  });
});
