import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { describe, expect, it, vi } from 'vitest';
import {
  normalizarTermino,
  PalabrasBloqueadasService,
} from './palabras-bloqueadas.service.js';

function crearPrismaMock() {
  return {
    palabraBloqueada: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('PalabrasBloqueadasService', () => {
  it('normaliza espacios exteriores y mayúsculas sin alterar la coincidencia exacta interna', () => {
    expect(normalizarTermino('  FraUde  ')).toBe('fraude');
    expect(normalizarTermino('fra ude')).toBe('fra ude');
  });

  it('rechaza términos vacíos o compuestos sólo por espacios', () => {
    expect(() => normalizarTermino('   ')).toThrow(BadRequestException);
  });

  it('lista una lista vacía sin bloquear términos', async () => {
    const prisma = crearPrismaMock();
    prisma.palabraBloqueada.findMany.mockResolvedValue([]);
    const service = new PalabrasBloqueadasService(prisma as never);

    await expect(service.listar()).resolves.toEqual([]);
    await expect(service.obtenerTerminosVigentes()).resolves.toEqual([]);
  });

  it('crea términos normalizados y consulta coincidencia exacta', async () => {
    const prisma = crearPrismaMock();
    prisma.palabraBloqueada.create.mockResolvedValue({
      id: 'id-1',
      termino: 'fraude',
      fechaCreacion: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.palabraBloqueada.findUnique.mockResolvedValue({ id: 'id-1' });
    const service = new PalabrasBloqueadasService(prisma as never);

    await expect(
      service.crear({ termino: '  FRAUDE ' }),
    ).resolves.toMatchObject({ id: 'id-1', termino: 'fraude' });
    expect(prisma.palabraBloqueada.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { termino: 'fraude' } }),
    );

    await expect(service.contieneTerminoExacto(' FRAUDE ')).resolves.toBe(true);
    expect(prisma.palabraBloqueada.findUnique).toHaveBeenCalledWith({
      where: { termino: 'fraude' },
      select: { id: true },
    });
  });

  it('elimina un término y traduce un id inexistente a 404', async () => {
    const prisma = crearPrismaMock();
    prisma.palabraBloqueada.delete.mockResolvedValue({});
    const service = new PalabrasBloqueadasService(prisma as never);

    await expect(service.eliminar('id-1')).resolves.toBeUndefined();

    const errorPrisma = Object.create(
      Prisma.PrismaClientKnownRequestError.prototype,
    ) as Prisma.PrismaClientKnownRequestError;
    Object.assign(errorPrisma, { code: 'P2025' });
    prisma.palabraBloqueada.delete.mockRejectedValue(errorPrisma);
    await expect(service.eliminar('id-inexistente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
