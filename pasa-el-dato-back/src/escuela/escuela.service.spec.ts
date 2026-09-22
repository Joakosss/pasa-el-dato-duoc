import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { EscuelaService } from './escuela.service.js';

describe('EscuelaService', () => {
  let service: EscuelaService;

  const prismaFalso = {
    escuela: { findMany: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        EscuelaService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    service = modulo.get(EscuelaService);
  });

  it('lista las escuelas ordenadas por nombre', async () => {
    const escuelas = [{ id: 1, nombre: 'Escuela de prueba' }];
    prismaFalso.escuela.findMany.mockResolvedValueOnce(escuelas);

    await expect(service.listar()).resolves.toEqual(escuelas);
    expect(prismaFalso.escuela.findMany).toHaveBeenCalledWith({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  });
});
