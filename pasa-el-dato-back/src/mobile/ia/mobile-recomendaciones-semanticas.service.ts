import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { DIMENSION_EMBEDDING, MODELO_EMBEDDING } from './gemini-embeddings.service.js';
import { huellaTexto } from './mobile-consentimiento.service.js';

interface VectorPublicacion {
  id: string;
  titulo: string;
  descripcion: string;
  huella: string;
  modelo: string;
  vector: number[];
  favorito: boolean;
}

function esVectorValido(vector: number[]): boolean {
  return Array.isArray(vector) && vector.length === DIMENSION_EMBEDDING &&
    vector.every((valor) => typeof valor === 'number' && Number.isFinite(valor)) &&
    vector.some((valor) => valor !== 0);
}

function similitud(a: number[], b: number[]): number {
  let producto = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    producto += a[i] * b[i];
    normaA += a[i] ** 2;
    normaB += b[i] ** 2;
  }
  return producto / Math.sqrt(normaA * normaB);
}

@Injectable()
export class MobileRecomendacionesSemanticasService {
  constructor(private readonly prisma: PrismaService) {}

  async ordenar<T extends { id: string }>(
    cuentaId: string,
    candidatos: T[],
  ): Promise<{ items: T[]; basadasEnIa: boolean }> {
    const respaldo = { items: candidatos, basadasEnIa: false };
    if (!candidatos.length) return respaldo;

    try {
      const ids = candidatos.map((item) => item.id);
      const filas = await this.prisma.$queryRaw<VectorPublicacion[]>`
        SELECT p.id, p.titulo, p.descripcion, c.huella_texto AS huella,
          c.modelo, c.vector,
          EXISTS (
            SELECT 1 FROM favorito f
            WHERE f.fk_publicacion = p.id AND f.fk_usuario = ${cuentaId}::uuid
              AND f.eliminado = false
          ) AS favorito
        FROM publicacion p
        JOIN mobile_consentimiento_ia c ON c.publicacion_id = p.id
        JOIN estado_publicacion e ON e.id = p.fk_estado_publicacion
        JOIN usuario u ON u.id_cuenta = p.fk_usuario
        JOIN cuenta cu ON cu.id_cuenta = u.id_cuenta
        WHERE p.eliminado = false AND e.descripcion = 'En curso'
          AND cu.eliminado = false AND cu.bloqueado = false AND cu.aprobada = true
          AND (p.id = ANY(${ids}::uuid[]) OR EXISTS (
            SELECT 1 FROM favorito f
            WHERE f.fk_publicacion = p.id AND f.fk_usuario = ${cuentaId}::uuid
              AND f.eliminado = false
          ))
        ORDER BY (p.id = ANY(${ids}::uuid[])) DESC, p.id ASC
        LIMIT 108
      `;
      const validas = filas.filter((fila) =>
        fila.modelo === MODELO_EMBEDDING &&
        fila.huella === huellaTexto(fila.titulo, fila.descripcion) &&
        esVectorValido(fila.vector),
      );
      const referencias = validas.filter((fila) => fila.favorito).map((fila) => fila.vector);
      if (!referencias.length) return respaldo;

      const vectores = new Map(validas.filter((fila) => !fila.favorito).map((fila) => [fila.id, fila.vector]));
      const puntuados = candidatos.map((item, indice) => {
        const vector = vectores.get(item.id);
        return {
          item,
          indice,
          puntuacion: vector ? Math.max(...referencias.map((referencia) => similitud(vector, referencia))) : null,
        };
      });
      if (!puntuados.some((item) => item.puntuacion !== null)) return respaldo;

      puntuados.sort((a, b) => {
        if (a.puntuacion === null) return b.puntuacion === null ? a.indice - b.indice : 1;
        if (b.puntuacion === null) return -1;
        return b.puntuacion - a.puntuacion || a.indice - b.indice;
      });
      return { items: puntuados.map(({ item }) => item), basadasEnIa: true };
    } catch {
      // Incluye el caso en que la migración todavía no se haya aplicado.
      return respaldo;
    }
  }
}
