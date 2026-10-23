import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegionService } from './region.service.js';

describe('RegionService', () => {
  let service: RegionService;

  const prismaFalso = {
    region: { findMany: vi.fn(), count: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        RegionService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    service = modulo.get(RegionService);
  });

  it('lista las regiones con id, nombre y codigoSubdere', async () => {
    const regiones = [
      {
        id: 1,
        nombre: 'Región Metropolitana de Santiago',
        codigoSubdere: '13',
      },
    ];
    prismaFalso.region.findMany.mockResolvedValueOnce(regiones);

    await expect(service.listar()).resolves.toEqual(regiones);
    expect(prismaFalso.region.findMany).toHaveBeenCalledWith({
      select: { id: true, nombre: true, codigoSubdere: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('asegurarExistencia no falla si la región existe', async () => {
    prismaFalso.region.count.mockResolvedValueOnce(1);

    await expect(service.asegurarExistencia(1)).resolves.toBeUndefined();
    expect(prismaFalso.region.count).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('asegurarExistencia lanza 404 si la región no existe', async () => {
    prismaFalso.region.count.mockResolvedValueOnce(0);

    await expect(service.asegurarExistencia(999)).rejects.toThrow(
      'Región no existe',
    );
  });
});
