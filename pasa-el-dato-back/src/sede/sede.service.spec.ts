import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { SedeService } from './sede.service.js';

describe('SedeService', () => {
  let service: SedeService;

  const prismaFalso = {
    sede: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        SedeService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    service = modulo.get(SedeService);
  });

  it('lista las sedes ordenadas por nombre', async () => {
    const sedes = [{ id: 1, nombre: 'Puente Alto', activa: true }];
    prismaFalso.sede.findMany.mockResolvedValueOnce(sedes);

    await expect(service.listar()).resolves.toEqual(sedes);
    expect(prismaFalso.sede.findMany).toHaveBeenCalledWith({
      select: { id: true, nombre: true, activa: true },
      orderBy: { nombre: 'asc' },
    });
  });
});
