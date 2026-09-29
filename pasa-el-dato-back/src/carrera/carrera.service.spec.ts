import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { CarreraService } from './carrera.service.js';

describe('CarreraService', () => {
  let service: CarreraService;

  const prismaFalso = {
    carrera: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        CarreraService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    service = modulo.get(CarreraService);
  });

  it('lista todas las carreras cuando no se entrega escuelaId', async () => {
    prismaFalso.carrera.findMany.mockResolvedValueOnce([]);

    await expect(service.listar()).resolves.toEqual([]);
    expect(prismaFalso.carrera.findMany).toHaveBeenCalledWith({
      where: {},
      select: {
        id: true,
        nombre: true,
        escuela: { select: { id: true, nombre: true } },
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('filtra las carreras cuando se entrega escuelaId', async () => {
    prismaFalso.carrera.findMany.mockResolvedValueOnce([]);

    await service.listar(3);

    expect(prismaFalso.carrera.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fk_escuela: 3 },
      }),
    );
  });
});
