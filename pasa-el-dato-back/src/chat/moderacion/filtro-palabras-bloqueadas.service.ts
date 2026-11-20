import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PalabrasBloqueadasService } from '../../palabras-bloqueadas/palabras-bloqueadas.service.js';

export const CONTENIDO_NO_PERMITIDO = 'Contenido no permitido';

const LISTA_VIGENTE_TTL_MS = 60_000;

@Injectable()
export class FiltroPalabrasBloqueadasService {
  private readonly logger = new Logger(FiltroPalabrasBloqueadasService.name);
  private cache: ReadonlySet<string> | null = null;
  private cargadoEn = 0;
  private cargaEnCurso: Promise<ReadonlySet<string>> | null = null;

  constructor(
    private readonly palabrasBloqueadasService: PalabrasBloqueadasService,
  ) {}

  async validarTexto(entrada: {
    texto: string;
    conversacionId: string;
    cuentaId: string;
  }): Promise<void> {
    const listaVigente = await this.obtenerListaVigente();
    const palabraBloqueada = this.encontrarPalabraBloqueada(
      entrada.texto,
      listaVigente,
    );

    if (!palabraBloqueada) {
      return;
    }

    this.logger.warn(
      `Mensaje rechazado por moderación: cuenta=${entrada.cuentaId} conversación=${entrada.conversacionId} longitud=${entrada.texto.length}`,
    );

    throw new UnprocessableEntityException(CONTENIDO_NO_PERMITIDO);
  }

  private async obtenerListaVigente(): Promise<ReadonlySet<string>> {
    const ahora = Date.now();

    if (this.cache && ahora - this.cargadoEn < LISTA_VIGENTE_TTL_MS) {
      return this.cache;
    }

    if (this.cargaEnCurso) {
      return this.cargaEnCurso;
    }

    this.cargaEnCurso = this.cargarListaVigente();

    try {
      const lista = await this.cargaEnCurso;
      this.cache = lista;
      this.cargadoEn = Date.now();
      return lista;
    } catch {
      // Fail-closed sin exponer detalle: si hay caché previa se reutiliza,
      // si no, se interrumpe el envío como error genérico (sin entregar).
      if (this.cache) {
        return this.cache;
      }
      throw new Error('No se pudo completar la operación de chat.');
    } finally {
      this.cargaEnCurso = null;
    }
  }

  private async cargarListaVigente(): Promise<ReadonlySet<string>> {
    const terminos =
      await this.palabrasBloqueadasService.obtenerTerminosVigentes();
    return new Set(terminos.map((palabra) => this.normalizarPalabra(palabra)));
  }

  private encontrarPalabraBloqueada(
    texto: string,
    listaVigente: ReadonlySet<string>,
  ): string | undefined {
    const palabras = texto
      .normalize('NFC')
      .toLocaleLowerCase('es-CL')
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean);

    return palabras.find((palabra) => listaVigente.has(palabra));
  }

  private normalizarPalabra(palabra: string): string {
    return palabra.normalize('NFC').toLocaleLowerCase('es-CL').trim();
  }
}
