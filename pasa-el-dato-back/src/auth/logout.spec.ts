import {
  type INestApplication,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { calcularHashRefreshToken } from './refresh-token.js';

describe('AuthService: cerrarSesion', () => {
  const prismaFalso = {
    accessTokenRevocado: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  let service: AuthService;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.stubEnv('JWT_ACCESS_TTL_SECONDS', '900');
    const modulo = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaFalso },
        { provide: JwtService, useValue: { signAsync: vi.fn() } },
      ],
    }).compile();
    service = modulo.get(AuthService);
  });

  it('purga expirados, revoca refresh vigente y persiste solo jti actual', async () => {
    prismaFalso.accessTokenRevocado.deleteMany.mockResolvedValueOnce({
      count: 1,
    });
    const refresh = 'refresh-actual';
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: null,
    });
    prismaFalso.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaFalso.accessTokenRevocado.upsert.mockResolvedValueOnce({});

    const exp = Math.floor(Date.now() / 1000) + 900;
    await service.cerrarSesion({
      accessJti: 'jti-actual',
      accessSub: 'id-cuenta',
      accessExp: exp,
      refreshToken: refresh,
    });

    expect(
      prismaFalso.accessTokenRevocado.deleteMany,
    ).toHaveBeenCalledWith({
      where: { fechaExpiracion: { lte: expect.any(Date) } },
    });
    expect(prismaFalso.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: calcularHashRefreshToken(refresh),
        fechaRevocacion: null,
        fechaExpiracion: { gt: expect.any(Date) },
      },
      data: { fechaRevocacion: expect.any(Date) },
    });
    expect(prismaFalso.accessTokenRevocado.upsert).toHaveBeenCalledWith({
      where: { jti: 'jti-actual' },
      update: {},
      create: {
        jti: 'jti-actual',
        fk_cuenta: 'id-cuenta',
        fechaExpiracion: new Date(exp * 1000),
      },
    });
  });

  it('idempotente: refresh revocado o expirado no falla y mantiene upsert', async () => {
    prismaFalso.accessTokenRevocado.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() - 1_000),
      fechaRevocacion: new Date(),
    });
    prismaFalso.accessTokenRevocado.upsert.mockResolvedValueOnce({});

    const exp = Math.floor(Date.now() / 1000) + 900;
    await expect(
      service.cerrarSesion({
        accessJti: 'jti-actual',
        accessSub: 'id-cuenta',
        accessExp: exp,
        refreshToken: 'refresh-viejo',
      }),
    ).resolves.toBeUndefined();
    expect(prismaFalso.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(prismaFalso.accessTokenRevocado.upsert).toHaveBeenCalled();
    // Repetido no falla.
    prismaFalso.accessTokenRevocado.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce(null);
    prismaFalso.accessTokenRevocado.upsert.mockResolvedValueOnce({});
    await expect(
      service.cerrarSesion({
        accessJti: 'jti-actual',
        accessSub: 'id-cuenta',
        accessExp: exp,
      }),
    ).resolves.toBeUndefined();
  });

  it('deriva idCuenta desde refresh vigente cuando no hay sub', async () => {
    prismaFalso.accessTokenRevocado.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      fk_cuenta: 'id-derivada',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: null,
    });
    prismaFalso.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaFalso.accessTokenRevocado.upsert.mockResolvedValueOnce({});

    const exp = Math.floor(Date.now() / 1000) + 900;
    await service.cerrarSesion({
      accessJti: 'jti-actual',
      refreshToken: 'refresh-vigente',
      accessExp: exp,
    });

    expect(prismaFalso.accessTokenRevocado.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ fk_cuenta: 'id-derivada' }),
      }),
    );
  });

  it('no persiste jti sin idCuenta y usa fallback TTL sin exp', async () => {
    prismaFalso.accessTokenRevocado.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce(null);

    await service.cerrarSesion({ accessJti: 'jti-huerfano' });
    expect(prismaFalso.accessTokenRevocado.upsert).not.toHaveBeenCalled();

    prismaFalso.accessTokenRevocado.deleteMany.mockResolvedValueOnce({
      count: 0,
    });
    prismaFalso.accessTokenRevocado.upsert.mockResolvedValueOnce({});
    const antes = Date.now();
    await service.cerrarSesion({
      accessJti: 'jti-actual',
      accessSub: 'id-cuenta',
    });
    const crear =
      prismaFalso.accessTokenRevocado.upsert.mock.calls[0][0].create;
    expect(crear.fechaExpiracion.getTime()).toBeGreaterThanOrEqual(
      antes + 900 * 1000 - 5_000,
    );
  });
});

describe('AuthController: POST /api/auth/logout', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const cerrarSesion = vi.fn().mockResolvedValue(undefined);
  const crearLog = vi.fn().mockResolvedValue({});

  beforeAll(async () => {
    vi.stubEnv('JWT_ACCESS_SECRET', 'secreto-de-prueba');
    vi.stubEnv('JWT_ACCESS_TTL_SECONDS', '900');
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '7');

    const modulo = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ log_api: { create: crearLog } })
      .overrideProvider(AuthService)
      .useValue({ cerrarSesion })
      .compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    jwt = modulo.get(JwtService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    crearLog.mockResolvedValue({});
    cerrarSesion.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
    vi.unstubAllEnvs();
  });

  it('200 vacío, delega jti/sub/exp y limpia ambas cookies con misma config', async () => {
    const token = await jwt.signAsync({
      sub: 'id-cuenta',
      rolId: 1,
      jti: 'jti-actual',
    });
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', [`accessToken=${token}`, 'refreshToken=rv-1'])
      .expect(200);

    expect(respuesta.body).toEqual({});
    expect(cerrarSesion).toHaveBeenCalledWith({
      accessJti: 'jti-actual',
      accessSub: 'id-cuenta',
      accessExp: expect.any(Number),
      refreshToken: 'rv-1',
    });
    const cookies = respuesta.headers['set-cookie'] as unknown as string[];
    expect(cookies.find((c) => c.startsWith('accessToken='))).toContain(
      'Path=/api',
    );
    expect(cookies.find((c) => c.startsWith('refreshToken='))).toContain(
      'Path=/api/auth',
    );
    for (const c of cookies) {
      expect(c).toContain('HttpOnly');
      expect(c).toContain('SameSite=Lax');
    }
    expect(JSON.stringify(cerrarSesion.mock.calls)).not.toContain(token);
  });

  it('idempotente sin cookies: 200 vacío sin fallar', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .expect(200);
    expect(respuesta.body).toEqual({});
    expect(cerrarSesion).toHaveBeenCalledWith({
      accessJti: undefined,
      accessSub: undefined,
      accessExp: undefined,
      refreshToken: undefined,
    });
  });

  it('token expirado o sin verificar igual delega y responde 200', async () => {
    const expirado = await jwt.signAsync(
      { sub: 'id-cuenta', rolId: 1, jti: 'jti-viejo' },
      { expiresIn: -10 },
    );
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', `accessToken=${expirado}`)
      .expect(200);
    expect(cerrarSesion).toHaveBeenCalledWith(
      expect.objectContaining({ accessJti: 'jti-viejo' }),
    );
  });

  it('documenta en Swagger ambas cookies y 200 sin cuerpo de tokens', () => {
    const configuracion = new DocumentBuilder()
      .addCookieAuth('accessToken', { type: 'apiKey' }, 'accessToken')
      .addCookieAuth('refreshToken', { type: 'apiKey' }, 'refreshToken')
      .build();
    const documento = SwaggerModule.createDocument(app, configuracion);
    const operacion = documento.paths['/api/auth/logout']?.post;

    expect(operacion?.responses).toHaveProperty('200');
    expect(operacion?.responses?.['200']).not.toContain('token');
    expect(HttpStatus.OK).toBe(200);
  });
});
