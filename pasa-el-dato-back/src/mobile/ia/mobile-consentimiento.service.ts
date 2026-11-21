import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service.js';
import { GeminiEmbeddingsService, MODELO_EMBEDDING } from './gemini-embeddings.service.js';

export function huellaTexto(titulo: string, descripcion: string): string {
  return createHash('sha256').update(JSON.stringify([titulo, descripcion])).digest('hex');
}

@Injectable()
export class MobileConsentimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: GeminiEmbeddingsService,
  ) {}

  async estado(publicacionId: string, cuentaId: string) {
    const filas = await this.prisma.$queryRaw<
      { titulo: string; descripcion: string; huella: string | null; vector: number[] | null }[]
    >`
      SELECT p.titulo, p.descripcion, c.huella_texto AS huella, c.vector
      FROM publicacion p
      LEFT JOIN mobile_consentimiento_ia c ON c.publicacion_id = p.id
      WHERE p.id = ${publicacionId}::uuid AND p.fk_usuario = ${cuentaId}::uuid
        AND p.eliminado = false
    `;
    const fila = filas[0];
    if (!fila) throw new NotFoundException('Publicación no encontrada.');
    const vigente = fila.huella === huellaTexto(fila.titulo, fila.descripcion);
    return {
      registrado: fila.huella !== null,
      autorizado: vigente,
      disponible: vigente && (fila.vector?.length ?? 0) > 0,
    };
  }

  async autorizar(publicacionId: string, cuentaId: string, titulo: string, descripcion: string) {
    const operacionId = randomUUID();
    const huella = huellaTexto(titulo, descripcion);
    const filas = await this.prisma.$queryRaw<{ publicacion_id: string }[]>`
      INSERT INTO mobile_consentimiento_ia
        (publicacion_id, huella_texto, modelo, operacion_id, vector, autorizado_en)
      SELECT p.id, ${huella}, ${MODELO_EMBEDDING}, ${operacionId}::uuid,
        ARRAY[]::double precision[], CURRENT_TIMESTAMP
      FROM publicacion p
      WHERE p.id = ${publicacionId}::uuid AND p.fk_usuario = ${cuentaId}::uuid
        AND p.eliminado = false AND p.titulo = ${titulo} AND p.descripcion = ${descripcion}
      ON CONFLICT (publicacion_id) DO UPDATE SET
        huella_texto = EXCLUDED.huella_texto,
        modelo = EXCLUDED.modelo,
        operacion_id = EXCLUDED.operacion_id,
        vector = EXCLUDED.vector,
        autorizado_en = EXCLUDED.autorizado_en
      RETURNING publicacion_id
    `;
    if (!filas.length) {
      throw new ConflictException('La publicación cambió o no está disponible. Vuelve a revisarla.');
    }

    const vector = await this.embeddings.generar(titulo, descripcion);
    const actualizadas = await this.prisma.$executeRaw`
      UPDATE mobile_consentimiento_ia c
      SET vector = ${vector}::double precision[]
      FROM publicacion p
      WHERE c.publicacion_id = p.id AND p.id = ${publicacionId}::uuid
        AND p.fk_usuario = ${cuentaId}::uuid AND p.eliminado = false
        AND p.titulo = ${titulo} AND p.descripcion = ${descripcion}
        AND c.operacion_id = ${operacionId}::uuid AND c.huella_texto = ${huella}
    `;
    if (actualizadas !== 1) {
      throw new ConflictException('La autorización o publicación cambió durante el procesamiento.');
    }
    return { registrado: true, autorizado: true, disponible: true };
  }

  async retirar(publicacionId: string, cuentaId: string) {
    const publicacion = await this.prisma.publicacion.findFirst({
      where: { id: publicacionId, fk_usuario: cuentaId, eliminado: false },
      select: { id: true },
    });
    if (!publicacion) throw new NotFoundException('Publicación no encontrada.');
    await this.prisma.$executeRaw`
      DELETE FROM mobile_consentimiento_ia c
      USING publicacion p
      WHERE c.publicacion_id = p.id AND p.id = ${publicacionId}::uuid
        AND p.fk_usuario = ${cuentaId}::uuid
    `;
    return { registrado: false, autorizado: false, disponible: false };
  }
}
