import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegionService } from '../region/region.service.js';
import { CiudadService } from './ciudad.service.js';

describe('CiudadService', () => {
  let service: CiudadService;

  const prismaFalso = {
    ciudad: { findMany: vi.fn(), count: vi.fn() },
  };

  const regionFalsa = {
    asegurarExistencia: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        CiudadService,
        { provide: PrismaService, useValue: prismaFalso },
        { provide: RegionService, useValue: regionFalsa },
      ],
    }).compile();

    service = modulo.get(CiudadService);
  });

  it('lista las ciudades de la región indicada', async () => {
    const ciudades = [
      {
        id: 1,
        idEntidad: '1320100300101',
        nombre: 'Puente Alto',
        regionId: 13,
      },
    ];
    prismaFalso.ciudad.findMany.mockResolvedValueOnce(ciudades);

    await expect(service.listar(13)).resolves.toEqual(ciudades);
    expect(regionFalsa.asegurarExistencia).toHaveBeenCalledWith(13);
    expect(prismaFalso.ciudad.findMany).toHaveBeenCalledWith({
      where: { regionId: 13 },
      select: { id: true, idEntidad: true, nombre: true, regionId: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  });

  it('conserva una ciudad legacy con idEntidad null', async () => {
    const ciudades = [{ id: 1, idEntidad: null, nombre: 'Ciudad legacy', regionId: 13 }];
    prismaFalso.ciudad.findMany.mockResolvedValueOnce(ciudades);

    await expect(service.listar(13)).resolves.toEqual(ciudades);
    expect(prismaFalso.ciudad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, idEntidad: true, nombre: true, regionId: true },
      }),
    );
  });

  it('propaga el 404 de la región inexistente sin consultar ciudades', async () => {
    regionFalsa.asegurarExistencia.mockRejectedValueOnce(
      new NotFoundException('Región no existe'),
    );

    await expect(service.listar(999)).rejects.toThrow('Región no existe');
    expect(prismaFalso.ciudad.findMany).not.toHaveBeenCalled();
  });

  it('asegurarExistencia lanza 404 si la ciudad no existe', async () => {
    prismaFalso.ciudad.count.mockResolvedValueOnce(0);

    await expect(service.asegurarExistencia(999)).rejects.toThrow(
      'Ciudad no existe',
    );
  });

  it('asegurarExistencia no falla si la ciudad existe', async () => {
    prismaFalso.ciudad.count.mockResolvedValueOnce(1);

    await expect(service.asegurarExistencia(1)).resolves.toBeUndefined();
  });
});
