import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DIMENSION_EMBEDDING, GeminiEmbeddingsService, MODELO_EMBEDDING } from './gemini-embeddings.service.js';

const claveOriginal = process.env.GEMINI_API_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  if (claveOriginal === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = claveOriginal;
});

describe('GeminiEmbeddingsService', () => {
  it('envía únicamente el texto proporcionado con la clave en la cabecera', async () => {
    process.env.GEMINI_API_KEY = 'clave-ficticia';
    const vector = Array<number>(DIMENSION_EMBEDDING).fill(0.5);
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ embedding: { values: vector } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new GeminiEmbeddingsService().generar('Título ficticio', 'Descripción ficticia'))
      .resolves.toEqual(vector);
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toContain(`${MODELO_EMBEDDING}:embedContent`);
    expect(url).not.toContain('clave-ficticia');
    expect(opciones.headers['x-goog-api-key']).toBe('clave-ficticia');
    const body = JSON.parse(opciones.body);
    expect(body.content.parts).toEqual([{ text: 'Título ficticio\nDescripción ficticia' }]);
    expect(body.taskType).toBe('SEMANTIC_SIMILARITY');
    expect(body.outputDimensionality).toBe(DIMENSION_EMBEDDING);
  });

  it('no envía datos cuando falta la clave', async () => {
    delete process.env.GEMINI_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(new GeminiEmbeddingsService().generar('Título', 'Descripción'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { embedding: { values: [1, 2] } },
    { embedding: { values: Array<number>(DIMENSION_EMBEDDING).fill(0) } },
    { embedding: { values: Array<string>(DIMENSION_EMBEDDING).fill('inválido') } },
    {},
  ])('rechaza respuestas con vectores inválidos', async (respuesta) => {
    process.env.GEMINI_API_KEY = 'clave-ficticia';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(respuesta)));

    await expect(new GeminiEmbeddingsService().generar('Título', 'Descripción'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rechaza sin revelar detalles ante un fallo de red', async () => {
    process.env.GEMINI_API_KEY = 'clave-ficticia';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('detalle privado')));

    await expect(new GeminiEmbeddingsService().generar('Título', 'Descripción'))
      .rejects.toThrow('No se pudo contactar el servicio de IA.');
  });
});
