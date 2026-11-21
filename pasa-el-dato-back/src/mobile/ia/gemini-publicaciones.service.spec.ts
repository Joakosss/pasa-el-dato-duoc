import 'reflect-metadata';
import { BadGatewayException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiPublicacionesService } from './gemini-publicaciones.service.js';

const solicitud = {
  titulo: 'Calculadora',
  descripcion: 'Calculadora en buen estado.',
  precio: '10000',
  imagenes: [{ buffer: Buffer.from('imagen de prueba'), mimeType: 'image/jpeg' }],
};

function respuestaGemini(texto: string): Response {
  return new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: texto }] } }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('GeminiPublicacionesService', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'clave-de-prueba');
    vi.stubEnv('GEMINI_MODEL', 'modelo-de-prueba');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rechaza el análisis si no está configurada la clave', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(new GeminiPublicacionesService().analizarPublicacion(solicitud))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envía el texto y la imagen y valida la evaluación recibida', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuestaGemini(JSON.stringify({
      estadoModeracion: 'REQUIERE_AJUSTES',
      puntajeCalidad: 75,
      resumen: ' Agrega detalles. ',
      hallazgos: ['Falta información', 123],
      sugerencias: ['Indica accesorios'],
      tituloSugerido: 'Calculadora científica',
    })));
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await new GeminiPublicacionesService().analizarPublicacion(solicitud);

    expect(resultado).toMatchObject({
      estadoModeracion: 'REQUIERE_AJUSTES',
      puntajeCalidad: 75,
      resumen: 'Agrega detalles.',
      hallazgos: ['Falta información'],
      sugerencias: ['Indica accesorios'],
      tituloSugerido: 'Calculadora científica',
    });
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/models/modelo-de-prueba:generateContent');
    const cuerpo = JSON.parse(String(opciones.body));
    expect(cuerpo.contents[0].parts[0].text).toContain(solicitud.titulo);
    expect(cuerpo.contents[0].parts[1].inlineData).toEqual({
      mimeType: 'image/jpeg',
      data: solicitud.imagenes[0].buffer.toString('base64'),
    });
  });

  it.each([
    'no es JSON',
    'null',
    '[]',
    '"texto"',
    '42',
    JSON.stringify({ estadoModeracion: 'APTA', puntajeCalidad: 101, resumen: 'Inválido' }),
    JSON.stringify({ estadoModeracion: 'DESCONOCIDA', puntajeCalidad: 50, resumen: 'Inválido' }),
  ])('rechaza una evaluación inválida: %s', async (texto) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaGemini(texto)));
    await expect(new GeminiPublicacionesService().analizarPublicacion(solicitud))
      .rejects.toBeInstanceOf(BadGatewayException);
  });

  it('no registra el detalle sensible de un error de red', async () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('clave-de-prueba dato privado')));

    await expect(new GeminiPublicacionesService().analizarPublicacion(solicitud))
      .rejects.toBeInstanceOf(BadGatewayException);
    expect(JSON.stringify(log.mock.calls)).not.toContain('clave-de-prueba');
    expect(JSON.stringify(log.mock.calls)).not.toContain('dato privado');
  });

  it('no registra el cuerpo de error devuelto por el proveedor', async () => {
    const log = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('clave-de-prueba dato privado', { status: 429 }),
    ));

    await expect(new GeminiPublicacionesService().analizarPublicacion(solicitud))
      .rejects.toBeInstanceOf(BadGatewayException);
    expect(JSON.stringify(log.mock.calls)).not.toContain('clave-de-prueba');
    expect(JSON.stringify(log.mock.calls)).not.toContain('dato privado');
  });
});
