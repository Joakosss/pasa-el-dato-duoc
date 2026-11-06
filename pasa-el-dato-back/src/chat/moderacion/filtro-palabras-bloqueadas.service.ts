import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';

export const CONTENIDO_NO_PERMITIDO = 'Contenido no permitido';

const PALABRAS_BLOQUEADAS_TEMPORALES = ['prohibida'];

@Injectable()
export class FiltroPalabrasBloqueadasService {
  private readonly logger = new Logger(FiltroPalabrasBloqueadasService.name);
  private readonly palabrasBloqueadas: ReadonlySet<string>;

  constructor() {
    this.palabrasBloqueadas = new Set(
      this.cargarPalabrasBloqueadas().map((palabra) =>
        this.normalizarPalabra(palabra),
      ),
    );
  }

  validarTexto(entrada: {
    texto: string;
    conversacionId: string;
    cuentaId: string;
  }): void {
    const palabraBloqueada = this.encontrarPalabraBloqueada(entrada.texto);

    if (!palabraBloqueada) {
      return;
    }

    this.logger.warn(
      `Mensaje rechazado por moderación: cuenta=${entrada.cuentaId} conversación=${entrada.conversacionId} longitud=${entrada.texto.length}`,
    );

    throw new UnprocessableEntityException(CONTENIDO_NO_PERMITIDO);
  }

  private cargarPalabrasBloqueadas(): string[] {
    const configuradas = process.env.PALABRAS_BLOQUEADAS
      ?.split(',')
      .map((palabra) => palabra.trim())
      .filter(Boolean);

    if (configuradas && configuradas.length > 0) {
      return configuradas;
    }

    // TODO[CHAT-05]: reemplazar por la fuente de verdad del dominio
    // administración cuando exista su contrato de palabras bloqueadas.
    return PALABRAS_BLOQUEADAS_TEMPORALES;
  }

  private encontrarPalabraBloqueada(texto: string): string | undefined {
    const palabras = texto
      .normalize('NFC')
      .toLocaleLowerCase('es-CL')
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean);

    return palabras.find((palabra) => this.palabrasBloqueadas.has(palabra));
  }

  private normalizarPalabra(palabra: string): string {
    return palabra.normalize('NFC').toLocaleLowerCase('es-CL').trim();
  }
}
