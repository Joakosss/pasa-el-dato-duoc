import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { PerfilService } from './perfil.service.js';

const prismaFalso = {
  usuario: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  cuenta: {
    update: vi.fn(),
  },
};

describe('PerfilService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtiene perfil con datos completos', async () => {
    prismaFalso.usuario.findUnique.mockResolvedValueOnce({
      run: '12345678-9',
      pNombre: 'Ana',
      sNombre: null,
      pApellido: 'Soto',
      sApellido: 'Rivas',
      cuenta: {
        correo: 'ana.soto@duocuc.cl',
        telefono: '912345678',
      },
      sede: {
        nombre: 'Puente Alto',
      },
      carrera: {
        nombre: 'Ingeniería en Informática',
      },
      rol_usuario: {
        descripcion: 'Estudiante',
      },
    });

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);
    const resultado = await service.obtenerPerfil('uuid-cuenta');

    expect(resultado).toEqual({
      run: '12345678-9',
      pNombre: 'Ana',
      sNombre: null,
      pApellido: 'Soto',
      sApellido: 'Rivas',
      correo: 'ana.soto@duocuc.cl',
      telefono: '912345678',
      sede: { nombre: 'Puente Alto' },
      carrera: { nombre: 'Ingeniería en Informática' },
      rol: { descripcion: 'Estudiante' },
    });

    expect(prismaFalso.usuario.findUnique).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      select: expect.objectContaining({
        run: true,
        cuenta: { select: { correo: true, telefono: true } },
        sede: { select: { nombre: true } },
        carrera: { select: { nombre: true } },
        rol_usuario: { select: { descripcion: true } },
      }),
    });
  });

  it('actualiza datos permitidos de usuario y cuenta', async () => {
    prismaFalso.usuario.findUnique
      .mockResolvedValueOnce({ id_cuenta: 'uuid-cuenta' })
      .mockResolvedValueOnce({
        run: '12345678-9',
        pNombre: 'Ana María',
        sNombre: 'Luisa',
        pApellido: 'Soto',
        sApellido: 'Rivas',
        cuenta: {
          correo: 'ana.soto@duocuc.cl',
          telefono: '12345678',
        },
        sede: {
          nombre: 'Puente Alto',
        },
        carrera: {
          nombre: 'Ingeniería en Informática',
        },
        rol_usuario: {
          descripcion: 'Estudiante',
        },
      });

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);
    const resultado = await service.actualizarPerfil('uuid-cuenta', {
      pNombre: 'Ana María',
      sNombre: 'Luisa',
      telefono: '12345678',
    });

    expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      data: {
        pNombre: 'Ana María',
        sNombre: 'Luisa',
      },
    });
    expect(prismaFalso.cuenta.update).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      data: {
        telefono: '12345678',
      },
    });
    expect(resultado).toEqual({
      run: '12345678-9',
      pNombre: 'Ana María',
      sNombre: 'Luisa',
      pApellido: 'Soto',
      sApellido: 'Rivas',
      correo: 'ana.soto@duocuc.cl',
      telefono: '12345678',
      sede: { nombre: 'Puente Alto' },
      carrera: { nombre: 'Ingeniería en Informática' },
      rol: { descripcion: 'Estudiante' },
    });
  });

  it('lanza 401 cuando usuario no existe al obtener perfil', async () => {
    prismaFalso.usuario.findUnique.mockResolvedValueOnce(null);

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);

    await expect(service.obtenerPerfil('inexistente')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lanza 401 cuando usuario no existe al actualizar perfil', async () => {
    prismaFalso.usuario.findUnique.mockResolvedValueOnce(null);

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);

    await expect(
      service.actualizarPerfil('inexistente', { telefono: '12345678' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
