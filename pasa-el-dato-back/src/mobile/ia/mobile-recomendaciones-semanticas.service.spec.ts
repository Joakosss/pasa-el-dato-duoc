import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../prisma/prisma.service.js';
import { DIMENSION_EMBEDDING, MODELO_EMBEDDING } from './gemini-embeddings.service.js';
import { huellaTexto } from './mobile-consentimiento.service.js';
import { MobileRecomendacionesSemanticasService } from './mobile-recomendaciones-semanticas.service.js';

function vector(x: number, y: number): number[] {
  return [x, y, ...Array<number>(DIMENSION_EMBEDDING - 2).fill(0)];
}

function fila(id: string, favorito: boolean, valores: number[]) {
  const titulo = `Título ${id}`;
  const descripcion = `Descripción ${id}`;
  return {
    id,
    titulo,
    descripcion,
    favorito,
    huella: huellaTexto(titulo, descripcion),
    modelo: MODELO_EMBEDDING,
    vector: valores,
  };
}

describe('recomendaciones semánticas mobile', () => {
  it('ordena candidatos por similitud con favoritos autorizados', async () => {
    const query = vi.fn().mockResolvedValue([
      fila('favorito', true, vector(1, 0)),
      fila('cercano', false, vector(1, 0)),
      fila('lejano', false, vector(0, 1)),
    ]);
    const servicio = new MobileRecomendacionesSemanticasService({ $queryRaw: query } as unknown as PrismaService);

    const resultado = await servicio.ordenar('cuenta', [{ id: 'lejano' }, { id: 'cercano' }]);

    expect(resultado).toEqual({
      basadasEnIa: true,
      items: [{ id: 'cercano' }, { id: 'lejano' }],
    });
  });

  it('ignora vectores obsoletos y conserva el respaldo si no hay referencias vigentes', async () => {
    const favorita = fila('favorito', true, vector(1, 0));
    favorita.titulo = 'Texto editado';
    const query = vi.fn().mockResolvedValue([favorita, fila('candidato', false, vector(1, 0))]);
    const servicio = new MobileRecomendacionesSemanticasService({ $queryRaw: query } as unknown as PrismaService);
    const candidatos = [{ id: 'candidato' }];

    expect(await servicio.ordenar('cuenta', candidatos)).toEqual({ basadasEnIa: false, items: candidatos });
  });

  it('usa las reglas originales si la tabla aún no está disponible', async () => {
    const query = vi.fn().mockRejectedValue(new Error('tabla no disponible'));
    const servicio = new MobileRecomendacionesSemanticasService({ $queryRaw: query } as unknown as PrismaService);
    const candidatos = [{ id: 'a' }, { id: 'b' }];

    expect(await servicio.ordenar('cuenta', candidatos)).toEqual({ basadasEnIa: false, items: candidatos });
  });

  it('ignora vectores inválidos y modelos distintos', async () => {
    const otroModelo = { ...fila('favorito', true, vector(1, 0)), modelo: 'otro' };
    const invalido = { ...fila('candidato', false, vector(1, 0)), vector: [Number.NaN] };
    const query = vi.fn().mockResolvedValue([otroModelo, invalido]);
    const servicio = new MobileRecomendacionesSemanticasService({ $queryRaw: query } as unknown as PrismaService);
    const candidatos = [{ id: 'candidato' }];

    expect(await servicio.ordenar('cuenta', candidatos)).toEqual({ basadasEnIa: false, items: candidatos });
  });
});
