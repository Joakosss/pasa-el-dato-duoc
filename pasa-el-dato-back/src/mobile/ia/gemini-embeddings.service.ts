import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export const MODELO_EMBEDDING = 'gemini-embedding-001';
export const DIMENSION_EMBEDDING = 768;

@Injectable()
export class GeminiEmbeddingsService {
  async generar(titulo: string, descripcion: string): Promise<number[]> {
    const clave = process.env.GEMINI_API_KEY?.trim();
    if (!clave) throw new ServiceUnavailableException('La IA no está configurada.');

    let respuesta: Response;
    try {
      respuesta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_EMBEDDING}:embedContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
          body: JSON.stringify({
            model: `models/${MODELO_EMBEDDING}`,
            content: { parts: [{ text: `${titulo}\n${descripcion}` }] },
            taskType: 'SEMANTIC_SIMILARITY',
            outputDimensionality: DIMENSION_EMBEDDING,
          }),
          signal: AbortSignal.timeout(15_000),
        },
      );
    } catch {
      throw new ServiceUnavailableException('No se pudo contactar el servicio de IA.');
    }
    if (!respuesta.ok) throw new ServiceUnavailableException('La IA no está disponible.');

    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      throw new ServiceUnavailableException('La IA devolvió una respuesta inválida.');
    }
    const valores = (cuerpo as { embedding?: { values?: unknown } })?.embedding?.values;
    if (
      !Array.isArray(valores) ||
      valores.length !== DIMENSION_EMBEDDING ||
      !valores.every((valor: unknown) => typeof valor === 'number' && Number.isFinite(valor)) ||
      !valores.some((valor: number) => valor !== 0)
    ) {
      throw new ServiceUnavailableException('La IA devolvió un vector inválido.');
    }
    return valores as number[];
  }
}
