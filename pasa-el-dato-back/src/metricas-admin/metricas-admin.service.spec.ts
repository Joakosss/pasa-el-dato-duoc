import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MetricasAdminService } from './metricas-admin.service.js';

function crearPrismaMock() {
  return {
    sede: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    log_api: {
      findMany: vi.fn(),
    },
    publicacion: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    categoria: {
      findMany: vi.fn(),
    },
    reportePublicacion: {
      count: vi.fn(),
    },
    reporteUsuario: {
      count: vi.fn(),
    },
  };
}

function configurarConsultasSinDatos(prisma: ReturnType<typeof crearPrismaMock>) {
  prisma.log_api.findMany.mockResolvedValue([]);
  prisma.publicacion.count.mockResolvedValue(0);
  prisma.publicacion.groupBy.mockResolvedValue([]);
  prisma.categoria.findMany.mockResolvedValue([]);
  prisma.sede.findMany.mockResolvedValue([]);
  prisma.reportePublicacion.count.mockResolvedValue(0);
  prisma.reporteUsuario.count.mockResolvedValue(0);
}

describe('MetricasAdminService', () => {
  it('agrega métricas y aplica filtro de sede', async () => {
    const prisma = crearPrismaMock();
    prisma.sede.findFirst.mockResolvedValue({ id: 7 });
    prisma.log_api.findMany.mockResolvedValue([
      { fk_cuenta: 'cuenta-1' },
      { fk_cuenta: 'cuenta-2' },
    ]);
    prisma.publicacion.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    prisma.publicacion.groupBy
      .mockResolvedValueOnce([
        { fk_categoria: 4, _count: { _all: 2 } },
        { fk_categoria: 5, _count: { _all: 1 } },
      ])
      .mockResolvedValueOnce([{ fk_sede: 7, _count: { _all: 3 } }]);
    prisma.categoria.findMany.mockResolvedValue([
      { id: 4, nombre: 'Libros' },
      { id: 5, nombre: 'Apuntes' },
    ]);
    prisma.sede.findMany.mockResolvedValue([{ id: 7, nombre: 'Alameda' }]);
    prisma.reportePublicacion.count.mockResolvedValue(2);
    prisma.reporteUsuario.count.mockResolvedValue(1);

    const service = new MetricasAdminService(prisma as never);

    const resultado = await service.obtenerDashboard({
      desde: '2026-01-01T00:00:00.000Z',
      hasta: '2026-02-01T00:00:00.000Z',
      sedeId: 7,
    });

    expect(resultado).toMatchObject({
      hayDatos: true,
      metricas: {
        usuariosActivos: 2,
        publicaciones: {
          total: 3,
          porCategoria: [
            { categoriaId: 4, categoriaNombre: 'Libros', total: 2 },
            { categoriaId: 5, categoriaNombre: 'Apuntes', total: 1 },
          ],
          porSede: [{ sedeId: 7, sedeNombre: 'Alameda', total: 3 }],
        },
        transaccionesTotales: 1,
        reportesResueltos: 3,
      },
    });

    expect(prisma.publicacion.count).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ fk_sede: 7 }),
      }),
    );
    expect(prisma.reportePublicacion.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          publicacion: { fk_sede: 7 },
        }),
      }),
    );
  });

  it('devuelve respuesta explícita cuando no existen datos', async () => {
    const prisma = crearPrismaMock();
    configurarConsultasSinDatos(prisma);

    const service = new MetricasAdminService(prisma as never);

    const resultado = await service.obtenerDashboard({
      desde: '2099-01-01T00:00:00.000Z',
      hasta: '2099-02-01T00:00:00.000Z',
    });

    expect(resultado).toMatchObject({
      hayDatos: false,
      mensajeSinDatos: 'Sin datos para el periodo o sede seleccionados.',
      metricas: {
        usuariosActivos: 0,
        publicaciones: {
          total: 0,
          porCategoria: [],
          porSede: [],
        },
        transaccionesTotales: 0,
        reportesResueltos: 0,
      },
    });
  });

  it('rechaza un rango invertido', async () => {
    const prisma = crearPrismaMock();
    const service = new MetricasAdminService(prisma as never);

    await expect(
      service.obtenerDashboard({
        desde: '2026-02-01T00:00:00.000Z',
        hasta: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza una sede inexistente', async () => {
    const prisma = crearPrismaMock();
    prisma.sede.findFirst.mockResolvedValue(null);
    const service = new MetricasAdminService(prisma as never);

    await expect(
      service.obtenerDashboard({
        sedeId: 999,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
