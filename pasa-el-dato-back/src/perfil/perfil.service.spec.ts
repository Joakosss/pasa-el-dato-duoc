import { Test } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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
  sede: {
    findFirst: vi.fn(),
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

  it('actualiza solo teléfono sin modificar usuario', async () => {
    prismaFalso.usuario.findUnique
      .mockResolvedValueOnce({ id_cuenta: 'uuid-cuenta' })
      .mockResolvedValueOnce({
        run: '12345678-9',
        pNombre: 'Ana',
        sNombre: null,
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
      telefono: '12345678',
    });

    expect(prismaFalso.usuario.update).not.toHaveBeenCalled();
    expect(prismaFalso.cuenta.update).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      data: {
        telefono: '12345678',
      },
    });
    expect(resultado.telefono).toBe('12345678');
  });

  it('actualiza solo sedeId sin modificar cuenta', async () => {
    prismaFalso.usuario.findUnique
      .mockResolvedValueOnce({ id_cuenta: 'uuid-cuenta' })
      .mockResolvedValueOnce({
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
          nombre: 'Maipú',
        },
        carrera: {
          nombre: 'Ingeniería en Informática',
        },
        rol_usuario: {
          descripcion: 'Estudiante',
        },
      });
    prismaFalso.sede.findFirst.mockResolvedValueOnce({ id: 2 });

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);
    const resultado = await service.actualizarPerfil('uuid-cuenta', {
      sedeId: 2,
    });

    expect(prismaFalso.sede.findFirst).toHaveBeenCalledWith({
      where: {
        id: 2,
        activa: true,
        eliminado: false,
      },
      select: { id: true },
    });
    expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      data: {
        fk_sede: 2,
      },
    });
    expect(prismaFalso.cuenta.update).not.toHaveBeenCalled();
    expect(resultado.sede).toEqual({ nombre: 'Maipú' });
  });

  it('actualiza teléfono y sedeId en la misma solicitud', async () => {
    prismaFalso.usuario.findUnique
      .mockResolvedValueOnce({ id_cuenta: 'uuid-cuenta' })
      .mockResolvedValueOnce({
        run: '12345678-9',
        pNombre: 'Ana',
        sNombre: null,
        pApellido: 'Soto',
        sApellido: 'Rivas',
        cuenta: {
          correo: 'ana.soto@duocuc.cl',
          telefono: '12345678',
        },
        sede: {
          nombre: 'Maipú',
        },
        carrera: {
          nombre: 'Ingeniería en Informática',
        },
        rol_usuario: {
          descripcion: 'Estudiante',
        },
      });
    prismaFalso.sede.findFirst.mockResolvedValueOnce({ id: 2 });

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);
    await service.actualizarPerfil('uuid-cuenta', {
      telefono: '12345678',
      sedeId: 2,
    });

    expect(prismaFalso.usuario.update).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      data: {
        fk_sede: 2,
      },
    });
    expect(prismaFalso.cuenta.update).toHaveBeenCalledWith({
      where: { id_cuenta: 'uuid-cuenta' },
      data: {
        telefono: '12345678',
      },
    });
  });

  it('lanza 400 con payload vacío y no modifica base de datos', async () => {
    prismaFalso.usuario.findUnique.mockResolvedValueOnce({ id_cuenta: 'uuid-cuenta' });

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);

    await expect(service.actualizarPerfil('uuid-cuenta', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaFalso.usuario.update).not.toHaveBeenCalled();
    expect(prismaFalso.cuenta.update).not.toHaveBeenCalled();
    expect(prismaFalso.sede.findFirst).not.toHaveBeenCalled();
  });

  it('lanza 400 cuando la sede no es válida', async () => {
    prismaFalso.usuario.findUnique.mockResolvedValueOnce({ id_cuenta: 'uuid-cuenta' });
    prismaFalso.sede.findFirst.mockResolvedValueOnce(null);

    const modulo = await Test.createTestingModule({
      providers: [
        PerfilService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    const service = modulo.get(PerfilService);

    await expect(
      service.actualizarPerfil('uuid-cuenta', { sedeId: 999 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaFalso.usuario.update).not.toHaveBeenCalled();
    expect(prismaFalso.cuenta.update).not.toHaveBeenCalled();
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
