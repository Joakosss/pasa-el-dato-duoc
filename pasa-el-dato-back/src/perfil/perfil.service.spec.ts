import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { PerfilService } from './perfil.service.js';

const prismaFalso = {
  usuario: {
    findUnique: vi.fn(),
  },
};

describe('PerfilService', () => {
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

  it('lanza 401 cuando usuario no existe', async () => {
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
});
