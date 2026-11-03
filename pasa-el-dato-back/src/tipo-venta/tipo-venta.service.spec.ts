import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { TipoVentaService } from './tipo-venta.service.js';

describe('TipoVentaService', () => {
  let service: TipoVentaService;

  const prismaFalso = {
    tipoVenta: { findMany: vi.fn(), findUnique: vi.fn() },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [TipoVentaService, { provide: PrismaService, useValue: prismaFalso }],
    }).compile();

    service = modulo.get(TipoVentaService);
  });

  it('lista los tipos de venta ordenados por nombre e id', async () => {
    prismaFalso.tipoVenta.findMany.mockResolvedValueOnce([]);

    await expect(service.listar()).resolves.toEqual([]);
    expect(prismaFalso.tipoVenta.findMany).toHaveBeenCalledWith({
      select: { id: true, nombre: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('obtiene un tipo de venta por id', async () => {
    prismaFalso.tipoVenta.findUnique.mockResolvedValueOnce({
      id: 1,
      nombre: 'Servicio',
    });

    await expect(service.obtenerPorId(1)).resolves.toEqual({
      id: 1,
      nombre: 'Servicio',
    });

    expect(prismaFalso.tipoVenta.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, nombre: true },
    });
  });

  it('lanza NotFoundException si el tipo de venta no existe', async () => {
    prismaFalso.tipoVenta.findUnique.mockResolvedValueOnce(null);

    await expect(service.obtenerPorId(999)).rejects.toMatchObject({
      status: 404,
      message: 'Tipo de venta no encontrado',
    });
  });
});
