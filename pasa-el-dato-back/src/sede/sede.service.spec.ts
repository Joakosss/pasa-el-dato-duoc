import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComunaService } from '../comuna/comuna.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SedeService } from './sede.service.js';

describe('SedeService', () => {
  let service: SedeService;

  const prismaFalso = {
    sede: { findMany: vi.fn() },
  };

  const comunaFalsa = {
    asegurarExistencia: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        SedeService,
        { provide: PrismaService, useValue: prismaFalso },
        { provide: ComunaService, useValue: comunaFalsa },
      ],
    }).compile();

    service = modulo.get(SedeService);
  });

  it('lista las sedes ordenadas por nombre sin filtros (comportamiento histórico)', async () => {
    const sedes = [{ id: 1, nombre: 'Puente Alto', activa: true }];
    prismaFalso.sede.findMany.mockResolvedValueOnce(sedes);

    await expect(service.listar()).resolves.toEqual(sedes);
    expect(comunaFalsa.asegurarExistencia).not.toHaveBeenCalled();
    expect(prismaFalso.sede.findMany).toHaveBeenCalledWith({
      select: { id: true, nombre: true, activa: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('filtra por comuna cuando recibe comunaId', async () => {
    prismaFalso.sede.findMany.mockResolvedValueOnce([]);

    await service.listar({ comunaId: 5 });

    expect(comunaFalsa.asegurarExistencia).toHaveBeenCalledWith(5);
    expect(prismaFalso.sede.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { comunaId: 5 } }),
    );
  });

  it('propaga 404 cuando la comuna del filtro no existe', async () => {
    comunaFalsa.asegurarExistencia.mockRejectedValueOnce(
      new NotFoundException('Comuna no existe'),
    );

    await expect(service.listar({ comunaId: 999 })).rejects.toThrow(
      'Comuna no existe',
    );
    expect(prismaFalso.sede.findMany).not.toHaveBeenCalled();
  });

  it('con soloDisponibles=true filtra activas y no eliminadas', async () => {
    prismaFalso.sede.findMany.mockResolvedValueOnce([]);

    await service.listar({ soloDisponibles: true });

    expect(prismaFalso.sede.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { activa: true, eliminado: false },
      }),
    );
  });

  it('soloDisponibles=false no agrega filtros', async () => {
    prismaFalso.sede.findMany.mockResolvedValueOnce([]);

    await service.listar({ soloDisponibles: false });

    expect(prismaFalso.sede.findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({
        where: expect.objectContaining({ activa: expect.anything() }),
      }),
    );
  });
});
