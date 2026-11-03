import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { CategoriaService } from './categoria.service.js';

describe('CategoriaService', () => {
  let service: CategoriaService;

  const prismaFalso = {
    categoria: { findMany: vi.fn(), findUnique: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        CategoriaService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    service = modulo.get(CategoriaService);
  });

  it('lista las categorías ordenadas por nombre e id', async () => {
    prismaFalso.categoria.findMany.mockResolvedValueOnce([]);

    await expect(service.listar()).resolves.toEqual([]);
    expect(prismaFalso.categoria.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('obtiene una categoría por id', async () => {
    prismaFalso.categoria.findUnique.mockResolvedValueOnce({
      id: 1,
      nombre: 'Accesorios',
    });

    await expect(service.obtenerPorId(1)).resolves.toEqual({
      id: 1,
      nombre: 'Accesorios',
    });

    expect(prismaFalso.categoria.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, nombre: true },
    });
  });

  it('lanza NotFoundException si la categoría no existe', async () => {
    prismaFalso.categoria.findUnique.mockResolvedValueOnce(null);

    await expect(service.obtenerPorId(999)).rejects.toMatchObject({
      status: 404,
      message: 'Categoría no encontrada',
    });
  });
});
