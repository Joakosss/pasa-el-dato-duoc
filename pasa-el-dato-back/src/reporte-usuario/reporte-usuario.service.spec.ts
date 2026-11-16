import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { describe, expect, it, vi } from 'vitest';
import { ReporteUsuarioService } from './reporte-usuario.service.js';

function crearPrismaMock() {
  return {
    motivoReporteUsuario: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    cuenta: {
      findUnique: vi.fn(),
    },
    reporteUsuario: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('ReporteUsuarioService (HU-REP-02)', () => {
  function prepararCreacionValida(prisma: ReturnType<typeof crearPrismaMock>) {
    prisma.motivoReporteUsuario.findUnique.mockResolvedValue({
      id: 2,
      nombre: 'Estafa o fraude en la transacción',
    });
    prisma.cuenta.findUnique.mockResolvedValue({
      id_cuenta: 'reportado-1',
      eliminado: false,
    });
    prisma.reporteUsuario.count.mockResolvedValue(0);
    prisma.reporteUsuario.create.mockResolvedValue({
      id: 'reporte-nuevo',
      fechaCreacion: new Date('2026-11-15T21:00:00.000Z'),
    });
  }

  it('lista los motivos del catálogo ordenados por id', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporteUsuario.findMany.mockResolvedValue([
      { id: 1, nombre: 'Acoso o trato abusivo' },
    ]);

    const service = new ReporteUsuarioService(prisma as never);

    await expect(service.listarMotivos()).resolves.toEqual([
      { id: 1, nombre: 'Acoso o trato abusivo' },
    ]);
    expect(prisma.motivoReporteUsuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { id: 'asc' } }),
    );
  });

  it('crea un reporte PENDIENTE con motivo del catálogo y reportante de la sesión', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);

    const service = new ReporteUsuarioService(prisma as never);
    const resultado = await service.crear({
      usuarioReportadoId: 'reportado-1',
      motivoId: 2,
      comentarios: '  Texto de prueba  ',
      idReportante: 'reportante-1',
    });

    expect(resultado).toMatchObject({
      id: 'reporte-nuevo',
      usuarioReportadoId: 'reportado-1',
      motivoId: 2,
      comentarios: 'Texto de prueba',
      estado: 'PENDIENTE',
    });
    expect(prisma.reporteUsuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fk_motivo: 2,
          descripcion: 'Texto de prueba',
          fk_reportado: 'reportado-1',
          fk_reportante: 'reportante-1',
          estado: 'PENDIENTE',
        }),
      }),
    );
  });

  it('guarda descripcion vacía cuando no hay comentarios (columna NOT NULL)', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);

    const service = new ReporteUsuarioService(prisma as never);

    await expect(
      service.crear({
        usuarioReportadoId: 'reportado-1',
        motivoId: 2,
        idReportante: 'reportante-1',
      }),
    ).resolves.toMatchObject({ comentarios: null });
    expect(prisma.reporteUsuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ descripcion: '' }),
      }),
    );
  });

  it('rechaza con 422 un motivo fuera del catálogo', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporteUsuario.findUnique.mockResolvedValue(null);

    const service = new ReporteUsuarioService(prisma as never);

    await expect(
      service.crear({
        usuarioReportadoId: 'reportado-1',
        motivoId: 99,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.cuenta.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza con 404 un usuario reportado inexistente', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporteUsuario.findUnique.mockResolvedValue({
      id: 2,
      nombre: 'X',
    });
    prisma.cuenta.findUnique.mockResolvedValue(null);

    const service = new ReporteUsuarioService(prisma as never);

    await expect(
      service.crear({
        usuarioReportadoId: 'inexistente',
        motivoId: 2,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza un usuario reportado eliminado', async () => {
    const prisma = crearPrismaMock();
    prisma.motivoReporteUsuario.findUnique.mockResolvedValue({
      id: 2,
      nombre: 'X',
    });
    prisma.cuenta.findUnique.mockResolvedValue({
      id_cuenta: 'reportado-1',
      eliminado: true,
    });

    const service = new ReporteUsuarioService(prisma as never);

    await expect(
      service.crear({
        usuarioReportadoId: 'reportado-1',
        motivoId: 2,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza el autoreporte', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);

    const service = new ReporteUsuarioService(prisma as never);

    await expect(
      service.crear({
        usuarioReportadoId: 'reportado-1',
        motivoId: 2,
        idReportante: 'reportado-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.reporteUsuario.create).not.toHaveBeenCalled();
  });

  it('rechaza un duplicado del mismo reportante en curso', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);
    prisma.reporteUsuario.count.mockResolvedValue(1);

    const service = new ReporteUsuarioService(prisma as never);

    await expect(
      service.crear({
        usuarioReportadoId: 'reportado-1',
        motivoId: 2,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.reporteUsuario.create).not.toHaveBeenCalled();
  });

  it('traduce la violación del índice parcial (P2002) a conflicto de duplicado', async () => {
    const prisma = crearPrismaMock();
    prepararCreacionValida(prisma);
    prisma.reporteUsuario.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const service = new ReporteUsuarioService(prisma as never);

    await expect(
      service.crear({
        usuarioReportadoId: 'reportado-1',
        motivoId: 2,
        idReportante: 'reportante-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
