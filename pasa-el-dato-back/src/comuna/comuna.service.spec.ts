import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CiudadService } from '../ciudad/ciudad.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegionService } from '../region/region.service.js';
import { ComunaService } from './comuna.service.js';

describe('ComunaService', () => {
  let service: ComunaService;

  const prismaFalso = {
    comuna: { findMany: vi.fn(), count: vi.fn() },
  };

  const ciudadFalsa = {
    asegurarExistencia: vi.fn(),
  };

  const regionFalsa = {
    asegurarExistencia: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        ComunaService,
        { provide: PrismaService, useValue: prismaFalso },
        { provide: CiudadService, useValue: ciudadFalsa },
        { provide: RegionService, useValue: regionFalsa },
      ],
    }).compile();

    service = modulo.get(ComunaService);
  });

  it('lista las comunas de la región indicada', async () => {
    const comunas = [
      { id: 1, nombre: 'Puente Alto', codigoSubdere: '13201', regionId: 13 },
    ];
    prismaFalso.comuna.findMany.mockResolvedValueOnce(comunas);

    await expect(service.listar({ regionId: 13 })).resolves.toEqual(comunas);
    expect(regionFalsa.asegurarExistencia).toHaveBeenCalledWith(13);
    expect(ciudadFalsa.asegurarExistencia).not.toHaveBeenCalled();
    expect(prismaFalso.comuna.findMany).toHaveBeenCalledWith({
      where: { regionId: 13 },
      select: {
        id: true,
        nombre: true,
        codigoSubdere: true,
        regionId: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('lista la comuna asociada a una ciudad', async () => {
    const comunas = [
      { id: 1, nombre: 'Puente Alto', codigoSubdere: '13201', regionId: 13 },
    ];
    prismaFalso.comuna.findMany.mockResolvedValueOnce(comunas);

    await expect(service.listar({ ciudadId: 1 })).resolves.toEqual(comunas);
    expect(ciudadFalsa.asegurarExistencia).toHaveBeenCalledWith(1);
    expect(regionFalsa.asegurarExistencia).not.toHaveBeenCalled();
    expect(prismaFalso.comuna.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ciudades: { some: { id: 1 } } },
        select: {
          id: true,
          nombre: true,
          codigoSubdere: true,
          regionId: true,
        },
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('rechaza ausencia de ambos parámetros', async () => {
    await expect(service.listar({})).rejects.toThrow(
      'Debe indicar exactamente uno de regionId o ciudadId',
    );
    expect(prismaFalso.comuna.findMany).not.toHaveBeenCalled();
  });

  it('rechaza ambos parámetros al mismo tiempo', async () => {
    await expect(service.listar({ regionId: 1, ciudadId: 1 })).rejects.toThrow(
      'Debe indicar exactamente uno de regionId o ciudadId',
    );
    expect(prismaFalso.comuna.findMany).not.toHaveBeenCalled();
  });

  it('propaga el 404 de la región inexistente sin consultar comunas', async () => {
    regionFalsa.asegurarExistencia.mockRejectedValueOnce(
      new NotFoundException('Región no existe'),
    );

    await expect(service.listar({ regionId: 999 })).rejects.toThrow(
      'Región no existe',
    );
    expect(prismaFalso.comuna.findMany).not.toHaveBeenCalled();
  });

  it('propaga el 404 de la ciudad inexistente sin consultar comunas', async () => {
    ciudadFalsa.asegurarExistencia.mockRejectedValueOnce(
      new NotFoundException('Ciudad no existe'),
    );

    await expect(service.listar({ ciudadId: 999 })).rejects.toThrow(
      'Ciudad no existe',
    );
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
