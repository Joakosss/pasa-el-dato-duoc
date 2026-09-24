import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { generarHashContrasena } from '../common/security/contrasena-hash.js';
import { AuthService, type UsuarioAutenticado } from './auth.service.js';
import { calcularHashRefreshToken } from './refresh-token.js';

describe('AuthService: búsqueda de cuenta', () => {
  let service: AuthService;

  // Simula solamente la parte de Prisma utilizada por AuthService.
  const prismaFalso = {
    cuenta: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const jwtFalso = {
    signAsync: vi.fn(),
  };

  beforeEach(async () => {
    // Limpia respuestas y registros de llamadas entre pruebas.
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        AuthService,

        // Sustituye PrismaService por nuestra simulación.
        // Estas pruebas no se conectan a PostgreSQL.
        {
          provide: PrismaService,
          useValue: prismaFalso,
        },
        // Comprueba el contenido enviado al firmador sin generar un JWT real.
        {
          provide: JwtService,
          useValue: jwtFalso,
        },
      ],
    }).compile();

    service = modulo.get(AuthService);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('busca la cuenta por correo y obtiene su usuario y rol', async () => {
    const cuentaEncontrada = {
      id_cuenta: 'uuid-cuenta',
      correo: 'alumno@duocuc.cl',
      claveHash: 'hash-argon2',
      aprobada: true,
      bloqueado: false,
      usuario: {
        run: '12345678-5',
        pNombre: 'Ana',
        sNombre: null,
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        rol_usuario: {
          id: 1,
          descripcion: 'Estudiante',
        },
      },
    };

    // Define lo que devolverá Prisma en esta prueba.
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(
      cuentaEncontrada,
    );

    const resultado = await service.buscarCuentaPorCorreo(
      'alumno@duocuc.cl',
    );

    expect(resultado).toEqual(cuentaEncontrada);

    // Comprueba que la consulta solicite solamente los campos necesarios.
    expect(prismaFalso.cuenta.findUnique).toHaveBeenCalledWith({
      where: {
        correo: 'alumno@duocuc.cl',
      },
      select: {
        id_cuenta: true,
        correo: true,
        claveHash: true,
        aprobada: true,
        bloqueado: true,
        usuario: {
          select: {
            run: true,
            pNombre: true,
            sNombre: true,
            pApellido: true,
            sApellido: true,
            rol_usuario: {
              select: {
                id: true,
                descripcion: true,
              },
            },
          },
        },
      },
    });
  });

  it('devuelve null cuando el correo no está registrado', async () => {
    // findUnique devuelve null cuando no encuentra una cuenta.
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.buscarCuentaPorCorreo('inexistente@duocuc.cl'),
    ).resolves.toBeNull();
  });

  it('rechaza un correo inexistente sin revelar cuál credencial falló', async () => {
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.validarCredenciales({
        correo: 'inexistente@duocuc.cl',
        contrasena: 'clave123',
      }),
    ).rejects.toMatchObject({
      message: 'Credenciales inválidas',
      status: 401,
    });
  });

  it('usa el mismo error cuando la contraseña no coincide', async () => {
    // El hash es real; Prisma se simula para no depender de PostgreSQL.
    const claveHash = await generarHashContrasena('clave-correcta');
    // Una contraseña incorrecta no debe revelar que la cuenta está bloqueada.
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      claveHash,
      bloqueado: true,
      aprobada: false,
    });

    await expect(
      service.validarCredenciales({
        correo: 'alumno@duocuc.cl',
        contrasena: 'clave-equivocada',
      }),
    ).rejects.toMatchObject({
      message: 'Credenciales inválidas',
      status: 401,
    });
  });

  it('devuelve el usuario y rol sin exponer el hash cuando las credenciales son válidas', async () => {
    const claveHash = await generarHashContrasena('clave-correcta');
    const cuenta = {
      id_cuenta: 'uuid-cuenta',
      correo: 'alumno@duocuc.cl',
      claveHash,
      bloqueado: false,
      aprobada: true,
      usuario: {
        run: '12345678-5',
        pNombre: 'Ana',
        sNombre: null,
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        rol_usuario: { id: 1, descripcion: 'Estudiante' },
      },
    };
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(cuenta);

    const resultado = await service.validarCredenciales({
      correo: 'alumno@duocuc.cl',
      contrasena: 'clave-correcta',
    });

    expect(resultado).toEqual({
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
    });
    expect(resultado).not.toHaveProperty('claveHash');
  });

  it('rechaza una cuenta que todavía no tiene usuario asociado', async () => {
    const claveHash = await generarHashContrasena('clave-correcta');
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      claveHash,
      bloqueado: false,
      aprobada: true,
      usuario: null,
    });

    await expect(
      service.validarCredenciales({
        correo: 'alumno@duocuc.cl',
        contrasena: 'clave-correcta',
      }),
    ).rejects.toMatchObject({
      message: 'Credenciales inválidas',
      status: 401,
    });
  });

  it('rechaza una cuenta no aprobada después de validar la contraseña', async () => {
    const claveHash = await generarHashContrasena('clave-correcta');
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      claveHash,
      bloqueado: false,
      aprobada: false,
    });

    await expect(
      service.validarCredenciales({
        correo: 'alumno@duocuc.cl',
        contrasena: 'clave-correcta',
      }),
    ).rejects.toMatchObject({
      message: 'Cuenta inactiva',
      status: 403,
    });
  });

  it('prioriza el bloqueo cuando la cuenta tampoco está aprobada', async () => {
    const claveHash = await generarHashContrasena('clave-correcta');
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      claveHash,
      bloqueado: true,
      aprobada: false,
    });

    await expect(
      service.validarCredenciales({
        correo: 'alumno@duocuc.cl',
        contrasena: 'clave-correcta',
      }),
    ).rejects.toMatchObject({
      message: 'Cuenta bloqueada',
      status: 403,
    });
  });

  it('firma un JWT solo con el ID de la cuenta y el rol', async () => {
    const autenticado: UsuarioAutenticado = {
      idCuenta: 'uuid-cuenta',
      correo: 'alumno@duocuc.cl',
      usuario: {
        run: '12345678-5',
        pNombre: 'Ana',
        sNombre: null,
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        rol: { id: 7, descripcion: 'Estudiante' },
      },
    };
    jwtFalso.signAsync.mockResolvedValueOnce('jwt-de-prueba');

    await expect(service.generarAccessToken(autenticado)).resolves.toBe(
      'jwt-de-prueba',
    );
    // No se incluyen correo, RUN, nombre ni claveHash en el JWT.
    expect(jwtFalso.signAsync).toHaveBeenCalledWith({
      sub: 'uuid-cuenta',
      rolId: 7,
    });
  });

  it('guarda solo el hash del refresh token asociado a la cuenta', async () => {
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '7');
    prismaFalso.refreshToken.create.mockResolvedValueOnce({});

    const antes = Date.now();
    const token = await service.crearRefreshToken('uuid-cuenta');
    const despues = Date.now();
    const { data } = prismaFalso.refreshToken.create.mock.calls[0][0];
    const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;

    expect(data.tokenHash).toBe(calcularHashRefreshToken(token));
    expect(data.tokenHash).not.toBe(token);
    expect(data.cuenta).toEqual({
      connect: { id_cuenta: 'uuid-cuenta' },
    });
    expect(data.fechaExpiracion.getTime()).toBeGreaterThanOrEqual(
      antes + sieteDiasMs,
    );
    expect(data.fechaExpiracion.getTime()).toBeLessThanOrEqual(
      despues + sieteDiasMs,
    );
  });

  it('rechaza una duración inválida sin guardar un refresh token', async () => {
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '0');

    await expect(
      service.crearRefreshToken('uuid-cuenta'),
    ).rejects.toThrow(
      'REFRESH_TOKEN_TTL_DAYS debe ser un entero positivo',
    );
    expect(prismaFalso.refreshToken.create).not.toHaveBeenCalled();
  });

  it('coordina la validación y la creación de ambos tokens', async () => {
    const datos = {
      correo: 'alumno@duocuc.cl',
      contrasena: 'clave-correcta',
    };

    const usuario: UsuarioAutenticado = {
      idCuenta: 'uuid-cuenta',
      correo: datos.correo,
      usuario: {
        run: '12345678-5',
        pNombre: 'Ana',
        sNombre: null,
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        rol: { id: 1, descripcion: 'Estudiante' },
      },
    };

    // Simulamos cada paso para probar la coordinación, sin acceder a PostgreSQL.
    const validar = vi
      .spyOn(service, 'validarCredenciales')
      .mockResolvedValue(usuario);
    const acceso = vi
      .spyOn(service, 'generarAccessToken')
      .mockResolvedValue('jwt-de-prueba');
    const refresco = vi
      .spyOn(service, 'crearRefreshToken')
      .mockResolvedValue('refresh-de-prueba');

    const resultado = await service.iniciarSesion(datos);

    expect(validar).toHaveBeenCalledWith(datos);
    expect(acceso).toHaveBeenCalledWith(usuario);
    expect(refresco).toHaveBeenCalledWith(usuario.idCuenta);
    expect(resultado).toEqual({
      usuario,
      accessToken: 'jwt-de-prueba',
      refreshToken: 'refresh-de-prueba',
    });
  });

  it('encuentra un refresh token vigente por su hash', async () => {
    const token = 'token-de-prueba';
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'id-token',
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: null,
    });

    await expect(service.buscarRefreshTokenVigente(token)).resolves.toEqual({
      id: 'id-token',
      idCuenta: 'id-cuenta',
    });

    // Prisma recibe el hash, no el token original enviado en la cookie.
    expect(prismaFalso.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: calcularHashRefreshToken(token) },
      select: {
        id: true,
        fk_cuenta: true,
        fechaExpiracion: true,
        fechaRevocacion: true,
      },
    });
  });

  it('rechaza un refresh token inexistente', async () => {
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.buscarRefreshTokenVigente('desconocido'),
    ).resolves.toBeNull();
  });

  it('rechaza un refresh token vencido', async () => {
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'id-token',
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() - 60_000),
      fechaRevocacion: null,
    });

    await expect(
      service.buscarRefreshTokenVigente('vencido'),
    ).resolves.toBeNull();
  });

  it('rechaza un refresh token revocado', async () => {
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'id-token',
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: new Date(),
    });

    await expect(
      service.buscarRefreshTokenVigente('revocado'),
    ).resolves.toBeNull();
  });

  it('consulta el estado y rol actuales de la cuenta al renovar', async () => {
    const cuenta = {
      aprobada: true,
      bloqueado: false,
      usuario: { rol_usuario: { id: 1 } },
    };
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(cuenta);

    await expect(
      service.buscarCuentaParaRenovacion('id-cuenta'),
    ).resolves.toEqual(cuenta);

    // No se necesita leer la contraseña para renovar una sesión.
    expect(prismaFalso.cuenta.findUnique).toHaveBeenCalledWith({
      where: { id_cuenta: 'id-cuenta' },
      select: {
        aprobada: true,
        bloqueado: true,
        usuario: {
          select: {
            rol_usuario: { select: { id: true } },
          },
        },
      },
    });
  });

  it('devuelve null si la cuenta del refresh token ya no existe', async () => {
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.buscarCuentaParaRenovacion('id-inexistente'),
    ).resolves.toBeNull();
  });

  it('rota el refresh token y firma un JWT con el rol actual', async () => {
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '7');
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'id-token-viejo',
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: null,
    });
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      aprobada: true,
      bloqueado: false,
      usuario: { rol_usuario: { id: 2 } },
    });
    jwtFalso.signAsync.mockResolvedValueOnce('jwt-nuevo');
    prismaFalso.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaFalso.refreshToken.create.mockResolvedValueOnce({});
    prismaFalso.$transaction.mockImplementationOnce(
      (operacion: (tx: typeof prismaFalso) => Promise<unknown>) =>
        operacion(prismaFalso),
    );

    const resultado = await service.renovarSesion('token-viejo');

    expect(jwtFalso.signAsync).toHaveBeenCalledWith({
      sub: 'id-cuenta',
      rolId: 2,
    });
    expect(resultado.accessToken).toBe('jwt-nuevo');
    expect(resultado.idCuenta).toBe('id-cuenta');
    expect(resultado.refreshToken).not.toBe('token-viejo');
    expect(prismaFalso.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'id-token-viejo',
        fechaRevocacion: null,
        fechaExpiracion: { gt: expect.any(Date) },
      },
      data: { fechaRevocacion: expect.any(Date) },
    });
    const { data } = prismaFalso.refreshToken.create.mock.calls[0][0];
    expect(data.tokenHash).toBe(
      calcularHashRefreshToken(resultado.refreshToken),
    );
    expect(data.cuenta).toEqual({ connect: { id_cuenta: 'id-cuenta' } });
  });

  it('rechaza un refresh token desconocido sin generar otro', async () => {
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce(null);

    await expect(service.renovarSesion('desconocido')).rejects.toMatchObject({
      message: 'Sesión inválida',
      status: 401,
    });
    expect(prismaFalso.$transaction).not.toHaveBeenCalled();
  });

  it('impide renovar una cuenta bloqueada', async () => {
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'id-token',
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: null,
    });
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      aprobada: true,
      bloqueado: true,
      usuario: { rol_usuario: { id: 1 } },
    });

    await expect(service.renovarSesion('token')).rejects.toMatchObject({
      message: 'Cuenta bloqueada',
      status: 403,
    });
    expect(prismaFalso.$transaction).not.toHaveBeenCalled();
  });

  it('impide renovar una cuenta inactiva', async () => {
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'id-token',
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: null,
    });
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      aprobada: false,
      bloqueado: false,
      usuario: { rol_usuario: { id: 1 } },
    });

    await expect(service.renovarSesion('token')).rejects.toMatchObject({
      message: 'Cuenta inactiva',
      status: 403,
    });
    expect(prismaFalso.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza el segundo uso simultáneo del mismo token', async () => {
    prismaFalso.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'id-token-viejo',
      fk_cuenta: 'id-cuenta',
      fechaExpiracion: new Date(Date.now() + 60_000),
      fechaRevocacion: null,
    });
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({
      aprobada: true,
      bloqueado: false,
      usuario: { rol_usuario: { id: 1 } },
    });
    vi.stubEnv('REFRESH_TOKEN_TTL_DAYS', '7');
    jwtFalso.signAsync.mockResolvedValueOnce('jwt-nuevo');
    prismaFalso.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 });
    prismaFalso.$transaction.mockImplementationOnce(
      (operacion: (tx: typeof prismaFalso) => Promise<unknown>) =>
        operacion(prismaFalso),
    );

    await expect(service.renovarSesion('token-viejo')).rejects.toMatchObject({
      message: 'Sesión inválida',
      status: 401,
    });
    expect(prismaFalso.refreshToken.create).not.toHaveBeenCalled();
  });
});
