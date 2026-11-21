import { ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../prisma/prisma.service.js';
import type { GeminiEmbeddingsService } from './gemini-embeddings.service.js';
import { MobileConsentimientoService, huellaTexto } from './mobile-consentimiento.service.js';

function preparar() {
  const query = vi.fn();
  const execute = vi.fn();
  const findFirst = vi.fn();
  const generar = vi.fn();
  const prisma = { $queryRaw: query, $executeRaw: execute, publicacion: { findFirst } } as unknown as PrismaService;
  const embeddings = { generar } as unknown as GeminiEmbeddingsService;
  return { servicio: new MobileConsentimientoService(prisma, embeddings), query, execute, findFirst, generar };
}

describe('consentimiento IA mobile', () => {
  it('no envía contenido si no se pudo registrar consentimiento para el texto y propietario', async () => {
    const e = preparar();
    e.query.mockResolvedValue([]);
    await expect(e.servicio.autorizar('id', 'cuenta', 'Título', 'Descripción')).rejects.toBeInstanceOf(ConflictException);
    expect(e.generar).not.toHaveBeenCalled();
  });

  it('registra consentimiento antes de enviar y guarda el vector solo en la operación vigente', async () => {
    const e = preparar();
    e.query.mockResolvedValue([{ publicacion_id: 'id' }]);
    e.generar.mockImplementation(async () => {
      expect(e.query).toHaveBeenCalledOnce();
      return [1, 2];
    });
    e.execute.mockResolvedValue(1);

    const resultado = await e.servicio.autorizar('id', 'cuenta', 'Título', 'Descripción');

    expect(e.generar).toHaveBeenCalledWith('Título', 'Descripción');
    expect(resultado).toEqual({ registrado: true, autorizado: true, disponible: true });
    const parametros = e.execute.mock.calls[0];
    expect(parametros).toContain(huellaTexto('Título', 'Descripción'));
    expect(parametros).toContain('id');
  });

  it('no restaura la autorización si se retiró durante la llamada externa', async () => {
    const e = preparar();
    e.query.mockResolvedValue([{ publicacion_id: 'id' }]);
    let terminar!: (vector: number[]) => void;
    e.generar.mockReturnValue(new Promise<number[]>((resolve) => { terminar = resolve; }));
    e.findFirst.mockResolvedValue({ id: 'id' });
    e.execute.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const pendiente = e.servicio.autorizar('id', 'cuenta', 'Título', 'Descripción');
    await vi.waitFor(() => expect(e.generar).toHaveBeenCalledOnce());
    await e.servicio.retirar('id', 'cuenta');
    terminar([1, 2]);

    await expect(pendiente).rejects.toBeInstanceOf(ConflictException);
    expect(e.execute).toHaveBeenCalledTimes(2);
  });

  it('no permite retirar autorización de una publicación ajena', async () => {
    const e = preparar();
    e.findFirst.mockResolvedValue(null);
    await expect(e.servicio.retirar('id', 'otra-cuenta')).rejects.toBeInstanceOf(NotFoundException);
    expect(e.execute).not.toHaveBeenCalled();
  });

  it('distingue texto editado de autorización vigente', async () => {
    const e = preparar();
    e.query.mockResolvedValue([{ titulo: 'Nuevo', descripcion: 'Texto', huella: huellaTexto('Anterior', 'Texto'), vector: [1] }]);
    await expect(e.servicio.estado('id', 'cuenta')).resolves.toEqual({
      registrado: true, autorizado: false, disponible: false,
    });
  });

  it('propaga un fallo del proveedor sin guardar un vector', async () => {
    const e = preparar();
    e.query.mockResolvedValue([{ publicacion_id: 'id' }]);
    e.generar.mockRejectedValue(new ServiceUnavailableException());
    await expect(e.servicio.autorizar('id', 'cuenta', 'Título', 'Descripción')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(e.execute).not.toHaveBeenCalled();
  });
});
