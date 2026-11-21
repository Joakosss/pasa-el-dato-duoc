import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export type EstadoModeracionGemini = 'APTA' | 'REQUIERE_AJUSTES' | 'BLOQUEADA';

export interface ImagenAnalisisGemini {
  buffer: Buffer;
  mimeType: string;
}

export interface SolicitudAnalisisPublicacionGemini {
  titulo: string;
  descripcion: string;
  precio?: string;
  imagenes: ImagenAnalisisGemini[];
}

export interface AnalisisPublicacionGemini {
  estadoModeracion: EstadoModeracionGemini;
  puntajeCalidad: number;
  resumen: string;
  hallazgos: string[];
  sugerencias: string[];
  tituloSugerido?: string;
  descripcionSugerida?: string;
}

interface RespuestaGemini {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface RespuestaGeminiEstructurada {
  estadoModeracion?: unknown;
  puntajeCalidad?: unknown;
  resumen?: unknown;
  hallazgos?: unknown;
  sugerencias?: unknown;
  tituloSugerido?: unknown;
  descripcionSugerida?: unknown;
}

const ESTADOS_MODERACION = new Set<EstadoModeracionGemini>([
  'APTA',
  'REQUIERE_AJUSTES',
  'BLOQUEADA',
]);

function textoSeguro(valor: unknown, maximo: number): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const texto = valor.trim().slice(0, maximo);
  return texto || undefined;
}

function listaTextoSegura(valor: unknown, maximoItems: number, maximoCaracteres: number): string[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((item) => textoSeguro(item, maximoCaracteres))
    .filter((item): item is string => Boolean(item))
    .slice(0, maximoItems);
}

@Injectable()
export class GeminiPublicacionesService {
  private readonly logger = new Logger(GeminiPublicacionesService.name);

  async analizarPublicacion(
    solicitud: SolicitudAnalisisPublicacionGemini,
  ): Promise<AnalisisPublicacionGemini> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'El asistente IA no está configurado. Contacta al administrador.',
      );
    }

    const modelo = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    const partes: Array<Record<string, unknown>> = [
      {
        text: `Eres el asistente de calidad y seguridad del marketplace estudiantil Pasa el Dato Duoc, en Chile.
Analiza esta publicación antes de que la persona decida publicarla.

Debes detectar especialmente: productos o servicios ilegales o peligrosos, armas, drogas, medicamentos controlados, alcohol o tabaco para menores, explotación sexual, violencia explícita, estafas, doxxing/datos personales, discriminación, discurso de odio, fraude académico y contenido no relacionado con un marketplace estudiantil.

Evalúa también claridad, información de estado, accesorios, condiciones de entrega y coherencia entre texto e imágenes.

Usa esta rúbrica fija para el campo "puntajeCalidad", partiendo desde 100:
- resta 35 puntos por alimento usado, mordido, parcialmente consumido o no apto para venta;
- resta 20 puntos si falta el precio, solo cuando el precio informado sea "No informado";
- resta 15 puntos si faltan condiciones o lugar de entrega;
- resta 15 puntos si faltan datos importantes del estado, contenido o características;
- resta 15 puntos si hay incoherencia evidente entre texto e imágenes.
No inventes descuentos ni cambies criterios entre solicitudes. El puntaje final debe ser entero entre 0 y 100. Si los datos no cambian, conserva el mismo puntaje y los mismos hallazgos principales.

Responde SOLO JSON válido, sin Markdown, con este esquema:
{
  "estadoModeracion": "APTA" | "REQUIERE_AJUSTES" | "BLOQUEADA",
  "puntajeCalidad": número entero 0 a 100,
  "resumen": "explicación breve, respetuosa y en español",
  "hallazgos": ["máximo 4 hallazgos concretos"],
  "sugerencias": ["máximo 4 sugerencias accionables"],
  "tituloSugerido": "opcional, máximo 100 caracteres",
  "descripcionSugerida": "opcional, máximo 2000 caracteres"
}

Reglas: BLOQUEADA solo ante alto riesgo evidente; REQUIERE_AJUSTES ante información insuficiente, duda razonable o incoherencia. No inventes características no entregadas. Nunca solicites ni copies datos personales. Si se entrega un precio, no indiques que falta el precio; evalúa solo si su formato o coherencia es problemática.

Título: ${solicitud.titulo}
Precio informado: ${solicitud.precio ?? 'No informado'}
Descripción: ${solicitud.descripcion}`,
      },
    ];

    for (const imagen of solicitud.imagenes) {
      partes.push({
        inlineData: {
          mimeType: imagen.mimeType,
          data: imagen.buffer.toString('base64'),
        },
      });
    }

    let respuesta: Response | undefined;

    for (let intento = 0; intento < 3; intento += 1) {
      try {
        respuesta = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: partes }],
              generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0,
              maxOutputTokens: 1200,
              },
            }),
            signal: AbortSignal.timeout(60_000),
          },
        );
      } catch {
        this.logger.error('No fue posible contactar Gemini.');
        throw new BadGatewayException(
          'No pudimos contactar al asistente IA. Reintenta en unos momentos.',
        );
      }

      if (respuesta.ok || respuesta.status !== 503 || intento === 2) {
        break;
      }

      const esperaMs = 1_000 * 2 ** intento;
      this.logger.warn(
        `Gemini respondió HTTP 503; reintento ${intento + 1} de 2 en ${esperaMs} ms.`,
      );
      await new Promise<void>((resolver) => setTimeout(resolver, esperaMs));
    }

    if (!respuesta || !respuesta.ok) {
      this.logger.warn(
        `Gemini rechazó la solicitud: HTTP ${respuesta?.status ?? 'sin respuesta'}.`,
      );
      throw new BadGatewayException(
        'El asistente IA no pudo completar el análisis. Reintenta más tarde.',
      );
    }

    const cuerpo = (await respuesta.json()) as RespuestaGemini;
    const texto = cuerpo.candidates?.[0]?.content?.parts
      ?.map((parte) => parte.text ?? '')
      .join('')
      .trim();

    if (!texto) {
      throw new BadGatewayException('El asistente IA devolvió una respuesta vacía.');
    }

    let resultado: unknown;
    try {
      resultado = JSON.parse(texto);
    } catch {
      throw new BadGatewayException('El asistente IA devolvió una respuesta inválida.');
    }
    if (!resultado || typeof resultado !== 'object' || Array.isArray(resultado)) {
      throw new BadGatewayException('El asistente IA devolvió una respuesta inválida.');
    }
    const evaluacion = resultado as RespuestaGeminiEstructurada;

    const estado = evaluacion.estadoModeracion;
    const puntaje = evaluacion.puntajeCalidad;
    const resumen = textoSeguro(evaluacion.resumen, 500);

    if (
      typeof estado !== 'string' ||
      !ESTADOS_MODERACION.has(estado as EstadoModeracionGemini) ||
      typeof puntaje !== 'number' ||
      !Number.isInteger(puntaje) ||
      puntaje < 0 ||
      puntaje > 100 ||
      !resumen
    ) {
      throw new BadGatewayException('El asistente IA devolvió una evaluación incompleta.');
    }

    return {
      estadoModeracion: estado as EstadoModeracionGemini,
      puntajeCalidad: puntaje,
      resumen,
      hallazgos: listaTextoSegura(evaluacion.hallazgos, 4, 240),
      sugerencias: listaTextoSegura(evaluacion.sugerencias, 4, 240),
      tituloSugerido: textoSeguro(evaluacion.tituloSugerido, 100),
      descripcionSugerida: textoSeguro(evaluacion.descripcionSugerida, 2000),
    };
  }
}
