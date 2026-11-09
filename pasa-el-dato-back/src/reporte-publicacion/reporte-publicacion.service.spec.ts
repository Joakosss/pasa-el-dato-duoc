import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ReportePublicacionService } from './reporte-publicacion.service.js';

function crearPrismaMock() {
  return {
    reportePublicacion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    publicacion: {
      update: vi.fn(),
    },
    auditoriaAdmin: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback({
        reportePublicacion: {
          update: vi.fn(),
        },
        publicacion: {
          update: vi.fn(),
        },
        auditoriaAdmin: {
          create: vi.fn(),
        },
      }),
    ),
  };
}

describe('ReportePublicacionService', () => {
  it('toma un reporte pendiente y registra auditoría', async () => {
    const prisma = crearPrismaMock();
    prisma.reportePublicacion.updateMany.mockResolvedValue({ count: 1 });

    const service = new ReportePublicacionService(prisma as never);

    await service.tomarEnRevision('reporte-1', 'admin-1');

    expect(prisma.reportePublicacion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'reporte-1', estado: 'PENDIENTE' },
      }),
    );
    expect(prisma.auditoriaAdmin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accion: 'TOMAR_REPORTE_PUBLICACION',
          fk_admin: 'admin-1',
        }),
      }),
    );
  });

  it('rechaza tomar un reporte inexistente', async () => {
    const prisma = crearPrismaMock();
    prisma.reportePublicacion.updateMany.mockResolvedValue({ count: 0 });
    prisma.reportePublicacion.count.mockResolvedValue(0);

    const service = new ReportePublicacionService(prisma as never);

    await expect(service.tomarEnRevision('inexistente', 'admin-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('descarta un reporte sin actualizar la publicación', async () => {
    const prisma = crearPrismaMock();
    prisma.reportePublicacion.findUnique.mockResolvedValue({
      id: 'reporte-1',
      estado: 'PENDIENTE',
    });

    const service = new ReportePublicacionService(prisma as never);

    await service.descartar('reporte-1', 'admin-1');

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.publicacion.update).not.toHaveBeenCalled();
  });

  it('rechaza resolver un reporte ya descartado', async () => {
    const prisma = crearPrismaMock();
    prisma.reportePublicacion.findUnique.mockResolvedValue({
      id: 'reporte-1',
      estado: 'DESCARTADO',
    });

    const service = new ReportePublicacionService(prisma as never);

    await expect(service.resolverAdvertencia('reporte-1', 'admin-1', 'Advertencia')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('retira la publicación y resuelve el reporte dentro de una transacción', async () => {
    const prisma = crearPrismaMock();
    prisma.reportePublicacion.findUnique.mockResolvedValue({
      id: 'reporte-1',
      estado: 'EN_PROCESO',
      fk_publicacion: 'publicacion-1',
      publicacion: {
        id: 'publicacion-1',
        fk_usuario: 'vendedor-1',
        eliminado: false,
      },
    });

    const service = new ReportePublicacionService(prisma as never);

    await service.retirarPublicacion('reporte-1', 'admin-1', 'Incumplimiento');

    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('registra la advertencia sin retirar la publicación', async () => {
    const prisma = crearPrismaMock();
    prisma.reportePublicacion.findUnique.mockResolvedValue({
      id: 'reporte-1',
      estado: 'EN_PROCESO',
    });

    const service = new ReportePublicacionService(prisma as never);

    await service.resolverAdvertencia('reporte-1', 'admin-1', 'Mensaje válido');

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.publicacion.update).not.toHaveBeenCalled();
  });
});
