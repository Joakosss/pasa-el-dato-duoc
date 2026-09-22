import { Test } from '@nestjs/testing';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService: búsqueda de cuenta', () => {
  let service: AuthService;

  // Simula solamente la parte de Prisma utilizada por AuthService.
  const prismaFalso = {
    cuenta: {
      findUnique: vi.fn(),
    },
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
      ],
    }).compile();

    service = modulo.get(AuthService);
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
});