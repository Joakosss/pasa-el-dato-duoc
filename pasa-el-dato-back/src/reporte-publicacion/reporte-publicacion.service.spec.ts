import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { describe, expect, it, vi } from 'vitest';
import { ReportePublicacionService } from './reporte-publicacion.service.js';

function crearPrismaMock() {
  return {
    motivoReporte: {
      findUnique: vi.fn(),
    },
    reportePublicacion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    publicacion: {
      findUnique: vi.fn(),
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

  // HU-REP-01 (BE04-BE06): creación autenticada de reportes.

  function prepararCreacionValida(prisma: ReturnType<typeof crearPrismaMock>) {
    prisma.motivoReporte.findUnique.mockResolvedValue({
      id: 3,
      nombre: 'Contenido inapropiado',
    });
    prisma.publicacion.findUnique.mockResolvedValue({
      id: 'publicacion-1',
      eliminado: false,
      fk_usuario: 'vendedor-1',
      estadoPublicacion: { descripcion: 'En curso' },
    });
    prisma.reportePublicacion.count.mockResolvedValue(0);
    prisma.reportePublicacion.create.mockResolvedValue({
      id: 'reporte-nuevo',
      fechaCreacion: new Date('2026-11-15T20:30:00.000Z'),
    });
  }

  it('crea un reporte PENDIENTE con motivo del catálogo y reportante de la sesión', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);

    const service = new ReportePublicacionService(prisma as never);
    const resultado = await service.crear({
      publicacionId: 'publicacion-1',
      motivoId: 3,
      comentarios: '  Texto de prueba  ',
      idReportante: 'reportante-1',
    });

    expect(resultado).toMatchObject({
      id: 'reporte-nuevo',
      publicacionId: 'publicacion-1',
      motivoId: 3,
      comentarios: 'Texto de prueba',
      estado: 'PENDIENTE',
    });
    expect(prisma.reportePublicacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          motivo: 'Contenido inapropiado',
          fk_motivo: 3,
          fk_publicacion: 'publicacion-1',
          fk_reportante: 'reportante-1',
          estado: 'PENDIENTE',
        }),
      }),
    );
  });

  it('rechaza con 422 un motivo fuera del catálogo', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporte.findUnique.mockResolvedValue(null);

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'publicacion-1',
        motivoId: 99,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.publicacion.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza con 404 una publicación inexistente', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporte.findUnique.mockResolvedValue({ id: 3, nombre: 'X' });
    prisma.publicacion.findUnique.mockResolvedValue(null);

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'inexistente',
        motivoId: 3,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza una publicación pausada', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporte.findUnique.mockResolvedValue({ id: 3, nombre: 'X' });
    prisma.publicacion.findUnique.mockResolvedValue({
      id: 'publicacion-1',
      eliminado: false,
      fk_usuario: 'vendedor-1',
      estadoPublicacion: { descripcion: 'Pausado' },
    });

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'publicacion-1',
        motivoId: 3,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza una publicación eliminada aunque esté en curso', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporte.findUnique.mockResolvedValue({ id: 3, nombre: 'X' });
    prisma.publicacion.findUnique.mockResolvedValue({
      id: 'publicacion-1',
      eliminado: true,
      fk_usuario: 'vendedor-1',
      estadoPublicacion: { descripcion: 'En curso' },
    });

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'publicacion-1',
        motivoId: 3,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite reportar una publicación vendida', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);
    prisma.publicacion.findUnique.mockResolvedValue({
      id: 'publicacion-1',
      eliminado: false,
      fk_usuario: 'vendedor-1',
      estadoPublicacion: { descripcion: 'Vendido' },
    });

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'publicacion-1',
        motivoId: 3,
        idReportante: 'reportante-1',
      }),
    ).resolves.toMatchObject({ estado: 'PENDIENTE' });
  });

  it('rechaza el autoreporte de la publicación propia', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);
    prisma.publicacion.findUnique.mockResolvedValue({
      id: 'publicacion-1',
      eliminado: false,
      fk_usuario: 'reportante-1',
      estadoPublicacion: { descripcion: 'En curso' },
    });

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'publicacion-1',
        motivoId: 3,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza un duplicado del mismo reportante en curso', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);
    prisma.reportePublicacion.count.mockResolvedValue(1);

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'publicacion-1',
        motivoId: 3,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.reportePublicacion.create).not.toHaveBeenCalled();
  });

  it('traduce la violación del índice parcial (P2002) a conflicto de duplicado', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);
    prisma.reportePublicacion.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const service = new ReportePublicacionService(prisma as never);

    await expect(
      service.crear({
        publicacionId: 'publicacion-1',
        motivoId: 3,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
