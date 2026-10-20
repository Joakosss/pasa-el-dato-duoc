import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CiudadService } from '../ciudad/ciudad.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComunaService } from './comuna.service.js';

describe('ComunaService', () => {
  let service: ComunaService;

  const prismaFalso = {
    comuna: { findMany: vi.fn(), count: vi.fn() },
  };

  const ciudadFalsa = {
    asegurarExistencia: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        ComunaService,
        { provide: PrismaService, useValue: prismaFalso },
        { provide: CiudadService, useValue: ciudadFalsa },
      ],
    }).compile();

    service = modulo.get(ComunaService);
  });

  it('lista las comunas de la ciudad indicada', async () => {
    const comunas = [
      { id: 1, nombre: 'Puente Alto', codigoSubdere: '13201', ciudadId: 1 },
    ];
    prismaFalso.comuna.findMany.mockResolvedValueOnce(comunas);

    await expect(service.listar(1)).resolves.toEqual(comunas);
    expect(ciudadFalsa.asegurarExistencia).toHaveBeenCalledWith(1);
    expect(prismaFalso.comuna.findMany).toHaveBeenCalledWith({
      where: { ciudadId: 1 },
      select: {
        id: true,
        nombre: true,
        codigoSubdere: true,
        ciudadId: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('propaga el 404 de la ciudad inexistente sin consultar comunas', async () => {
    ciudadFalsa.asegurarExistencia.mockRejectedValueOnce(
      new NotFoundException('Ciudad no existe'),
    );

    await expect(service.listar(999)).rejects.toThrow('Ciudad no existe');
    expect(prismaFalso.comuna.findMany).not.toHaveBeenCalled();
  });

  it('asegurarExistencia lanza 404 si la comuna no existe', async () => {
    prismaFalso.comuna.count.mockResolvedValueOnce(0);

    await expect(service.asegurarExistencia(999)).rejects.toThrow(
      'Comuna no existe',
    );
  });

  it('asegurarExistencia no falla si la comuna existe', async () => {
    prismaFalso.comuna.count.mockResolvedValueOnce(1);

    await expect(service.asegurarExistencia(1)).resolves.toBeUndefined();
  });
});
