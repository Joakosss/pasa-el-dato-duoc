import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthModule } from './auth.module.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('GET /api/auth/sesion', () => {
  let app: INestApplication;
  const verificar = vi.fn();
  const buscarCuenta = vi.fn();
  const buscarRevocado = vi.fn().mockResolvedValue(null);
  const crearLog = vi.fn().mockResolvedValue({});

  beforeAll(async () => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'secreto-de-prueba');
    vi.stubEnv('JWT_ACCESS_TTL_SECONDS', '900');
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '7');

    const modulo = await Test.createTestingModule({
      imports: [AuthModule],
    })
      // Sin PostgreSQL: Prisma y firma se simulan.
      .overrideProvider(PrismaService)
      .useValue({
        cuenta: { findUnique: buscarCuenta },
        accessTokenRevocado: { findUnique: buscarRevocado },
        log_api: { create: crearLog },
      })
      .overrideProvider(JwtService)
      .useValue({ verifyAsync: verificar, signAsync: vi.fn() })
      .compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    crearLog.mockResolvedValue({});
    buscarRevocado.mockResolvedValue(null);
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('200 devuelve el único rol con id y descripción', async () => {
    verificar.mockResolvedValueOnce({ sub: 'uuid-cuenta', jti: 'jti-vigente' });
    buscarCuenta.mockResolvedValueOnce({
      aprobada: true,
      bloqueado: false,
      usuario: { rol_usuario: { id: 1, descripcion: 'Estudiante' } },
    });

    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/sesion')
      .set('Cookie', 'accessToken=jwt-vigente')
      .expect(200);

    expect(respuesta.body).toEqual({
      rol: { id: 1, descripcion: 'Estudiante' },
    });
    expect(verificar).toHaveBeenCalledWith('jwt-vigente');
    expect(buscarCuenta).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      select: {
        aprobada: true,
        bloqueado: true,
        usuario: {
          select: {
            rol_usuario: { select: { id: true, descripcion: true } },
          },
        },
      },
    });
  });

  it('401 sin cookie, sin exponer datos', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/sesion')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
    expect(verificar).not.toHaveBeenCalled();
    expect(buscarCuenta).not.toHaveBeenCalled();
  });

  it('401 con token inválido y mensaje genérico', async () => {
    verificar.mockRejectedValueOnce(new Error('invalid signature'));

    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/sesion')
      .set('Cookie', 'accessToken=token-roto')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('401 con token vencido y mensaje genérico', async () => {
    const expirado = new Error('jwt expired');
    expirado.name = 'TokenExpiredError';
    verificar.mockRejectedValueOnce(expirado);

    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/sesion')
      .set('Cookie', 'accessToken=token-vencido')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('401 cuando la cuenta está bloqueada, sin revelar el motivo', async () => {
    verificar.mockResolvedValueOnce({ sub: 'uuid-cuenta', jti: 'jti-vigente' });
    buscarCuenta.mockResolvedValueOnce({
      aprobada: true,
      bloqueado: true,
      usuario: { rol_usuario: { id: 1, descripcion: 'Estudiante' } },
    });

    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/sesion')
      .set('Cookie', 'accessToken=jwt-vigente')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('401 cuando el jti está revocado por logout', async () => {
    verificar.mockResolvedValueOnce({ sub: 'uuid-cuenta', jti: 'jti-revocado' });
    buscarRevocado.mockResolvedValueOnce({
      jti: 'jti-revocado',
      fk_cuenta: 'uuid-cuenta',
    });

    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/sesion')
      .set('Cookie', 'accessToken=jwt-revocado')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
    expect(buscarRevocado).toHaveBeenCalledWith({
      where: { jti: 'jti-revocado' },
    });
    expect(buscarCuenta).not.toHaveBeenCalled();
  });

  it('401 cuando el token no trae jti', async () => {
    verificar.mockResolvedValueOnce({ sub: 'uuid-cuenta' });

    const respuesta = await request(app.getHttpServer())
      .get('/api/auth/sesion')
      .set('Cookie', 'accessToken=jwt-sin-jti')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
    expect(buscarCuenta).not.toHaveBeenCalled();
  });
});
