import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicacionService } from './publicacion.service.js';

function crearPrismaMock() {
  return {
    sede: {
      findUnique: vi.fn(),
    },
    tipoVenta: {
      count: vi.fn(),
    },
    categoria: {
      count: vi.fn(),
    },
    estadoPublicacion: {
      findFirst: vi.fn(),
    },
  };
}

describe('PublicacionService', () => {
  let prismaMock: ReturnType<typeof crearPrismaMock>;
  let service: PublicacionService;

  beforeEach(() => {
    prismaMock = crearPrismaMock();
    service = new PublicacionService(prismaMock as never);
  });

  describe('asegurarSedeDisponible', () => {
    it('lanza 404 cuando la sede no existe', async () => {
      prismaMock.sede.findUnique.mockResolvedValue(null);

      await expect(service.asegurarSedeDisponible(1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.asegurarSedeDisponible(1)).rejects.toThrow('Sede no existe');
    });

    it('lanza 400 cuando la sede no está disponible', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: false, eliminado: false });

      await expect(service.asegurarSedeDisponible(1)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.asegurarSedeDisponible(1)).rejects.toThrow('Sede no disponible');
    });

    it('lanza 400 cuando la sede está eliminada', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: true });

      await expect(service.asegurarSedeDisponible(1)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.asegurarSedeDisponible(1)).rejects.toThrow('Sede no disponible');
    });

    it('no lanza error cuando la sede está disponible', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: false });

      await expect(service.asegurarSedeDisponible(1)).resolves.toBeUndefined();
    });
  });

  describe('asegurarTipoVentaExistente', () => {
    it('lanza 404 cuando el tipo de venta no existe', async () => {
      prismaMock.tipoVenta.count.mockResolvedValue(0);

      await expect(service.asegurarTipoVentaExistente(1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.asegurarTipoVentaExistente(1)).rejects.toThrow('Tipo de venta no existe');
    });

    it('no lanza error cuando el tipo de venta existe', async () => {
      prismaMock.tipoVenta.count.mockResolvedValue(1);

      await expect(service.asegurarTipoVentaExistente(1)).resolves.toBeUndefined();
    });
  });

  describe('asegurarCategoriaExistente', () => {
    it('lanza 404 cuando la categoría no existe', async () => {
      prismaMock.categoria.count.mockResolvedValue(0);

      await expect(service.asegurarCategoriaExistente(1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.asegurarCategoriaExistente(1)).rejects.toThrow('Categoría no existe');
    });

    it('no lanza error cuando la categoría existe', async () => {
      prismaMock.categoria.count.mockResolvedValue(1);

      await expect(service.asegurarCategoriaExistente(1)).resolves.toBeUndefined();
    });
  });

  describe('obtenerEstadoInicialPublicacion', () => {
    it('lanza 500 cuando no existe el estado En curso', async () => {
      prismaMock.estadoPublicacion.findFirst.mockResolvedValue(null);

      await expect(service.obtenerEstadoInicialPublicacion()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      await expect(service.obtenerEstadoInicialPublicacion()).rejects.toThrow(
        'Catálogo de estados incompleto',
      );
    });

    it('retorna el estado En curso cuando existe', async () => {
      prismaMock.estadoPublicacion.findFirst.mockResolvedValue({ id: 7, descripcion: 'En curso' });

      await expect(service.obtenerEstadoInicialPublicacion()).resolves.toEqual({
        id: 7,
        descripcion: 'En curso',
      });
    });
  });

  describe('asegurarCatalogosParaCrearPublicacion', () => {
    it('valida sede, tipo de venta, categoría y devuelve el estado inicial', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: false });
      prismaMock.tipoVenta.count.mockResolvedValue(1);
      prismaMock.categoria.count.mockResolvedValue(1);
      prismaMock.estadoPublicacion.findFirst.mockResolvedValue({ id: 9, descripcion: 'En curso' });

      await expect(
        service.asegurarCatalogosParaCrearPublicacion({
          sedeId: 1,
          tipoVentaId: 2,
          categoriaId: 3,
        }),
      ).resolves.toEqual({ estado: { id: 9, descripcion: 'En curso' } });

      expect(prismaMock.sede.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, activa: true, eliminado: true },
      });
      expect(prismaMock.tipoVenta.count).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prismaMock.categoria.count).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(prismaMock.estadoPublicacion.findFirst).toHaveBeenCalledWith({
        where: { descripcion: 'En curso' },
        select: { id: true, descripcion: true },
      });
    });
  });
});
