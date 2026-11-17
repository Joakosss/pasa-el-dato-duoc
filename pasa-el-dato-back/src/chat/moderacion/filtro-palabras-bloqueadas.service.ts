import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PalabrasBloqueadasService } from '../../palabras-bloqueadas/palabras-bloqueadas.service.js';

export const CONTENIDO_NO_PERMITIDO = 'Contenido no permitido';

@Injectable()
export class FiltroPalabrasBloqueadasService {
  private readonly logger = new Logger(FiltroPalabrasBloqueadasService.name);

  constructor(
    private readonly palabrasBloqueadasService: PalabrasBloqueadasService,
  ) {}

  async validarTexto(entrada: {
    texto: string;
    conversacionId: string;
    cuentaId: string;
  }): Promise<void> {
    try {
      await this.palabrasBloqueadasService.validarTexto(entrada.texto);
    } catch (error) {
      if (!(error instanceof UnprocessableEntityException)) {
        throw error;
      }

      this.logger.warn(
        `Mensaje rechazado por moderación: cuenta=${entrada.cuentaId} conversación=${entrada.conversacionId} longitud=${entrada.texto.length}`,
      );

      throw new UnprocessableEntityException(CONTENIDO_NO_PERMITIDO);
    }
  }
}
