import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { validarImagenesRecibidas, type ImagenRecibida } from './validar-imagenes.js';

const DIRECTORIO_UPLOADS_POR_DEFECTO = '/app/uploads-publicaciones';
const PREFIJO_URL_IMAGENES = '/api/uploads';

const EXTENSIONES_POR_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export interface ImagenAlmacenada {
  nombreArchivo: string;
  url: string;
  orden: number;
}

export interface ResultadoOperacionAlmacenamiento<T> {
  resultado: T;
  imagenes: ImagenAlmacenada[];
}

function asegurarRutaDentroDe(base: string, objetivo: string): void {
  const relativa = relative(base, objetivo);
  if (
    relativa === '' ||
    relativa === '.' ||
    (!relativa.startsWith('..') && !isAbsolute(relativa))
  ) {
    return;
  }

  throw new InternalServerErrorException(
    'No fue posible almacenar las imágenes',
  );
}

export function obtenerDirectorioUploads(
  valor = process.env.UPLOAD_DIR,
): string {
  const directorio = valor?.trim() || DIRECTORIO_UPLOADS_POR_DEFECTO;
  return isAbsolute(directorio) ? resolve(directorio) : resolve(process.cwd(), directorio);
}

@Injectable()
export class AlmacenamientoImagenesService {
  private readonly logger = new Logger(AlmacenamientoImagenesService.name);
  private readonly directorioUploads = obtenerDirectorioUploads();

  async ejecutarConImagenesAlmacenadas<T>(
    imagenes: ImagenRecibida[],
    operacion: (
      imagenes: ImagenAlmacenada[],
    ) => Promise<T>,
  ): Promise<ResultadoOperacionAlmacenamiento<T>> {
    // La validación también se ejecuta aquí para preservar invariantes del
    // servicio aunque el controlador ya haya filtrado MIME, cantidad y firma.
    // Si la validación funcional falla, se re-lanza como BadRequestException.
    // Si ocurre un error de disco o una excepción inesperada, se traduce a
    // InternalServerErrorException y se compensan todos los archivos escritos.

    const archivosTemporales: string[] = [];
    const archivosFinales: string[] = [];
    const imagenesAlmacenadas: ImagenAlmacenada[] = [];

    const dirTmpRequest = join(this.directorioUploads, 'tmp', randomUUID());

    try {
      validarImagenesRecibidas(imagenes);

      await mkdir(dirTmpRequest, { recursive: true });
      asegurarRutaDentroDe(this.directorioUploads, dirTmpRequest);

      for (const [indice, imagen] of imagenes.entries()) {
        const nombreArchivo = `${randomUUID()}${EXTENSIONES_POR_MIME[imagen.mimetype]}`;
        const rutaTemporal = join(dirTmpRequest, nombreArchivo);
        const rutaFinal = join(this.directorioUploads, nombreArchivo);

        asegurarRutaDentroDe(this.directorioUploads, rutaTemporal);
        asegurarRutaDentroDe(this.directorioUploads, rutaFinal);

        archivosTemporales.push(rutaTemporal);

        await writeFile(rutaTemporal, imagen.buffer);
        await rename(rutaTemporal, rutaFinal);
        archivosFinales.push(rutaFinal);

        imagenesAlmacenadas.push({
          nombreArchivo: basename(nombreArchivo),
          url: `${PREFIJO_URL_IMAGENES}/${basename(nombreArchivo)}`,
          orden: indice + 1,
        });
      }

      const resultado = await operacion(imagenesAlmacenadas);

      // El directorio tmp/<uuid> deja de tener razón de existir cuando la
      // operación asociada termina bien; tmp/ padre se conserva.
      await rm(dirTmpRequest, { recursive: true, force: true }).catch(
        () => undefined,
      );

      return { resultado, imagenes: imagenesAlmacenadas };
    } catch (error) {
      await this.eliminarArchivos(archivosTemporales, archivosFinales);
      await rm(dirTmpRequest, { recursive: true, force: true }).catch(() => undefined);

      // Intento benigno de eliminar tmp/ si quedó vacío: un fallo deja el
      // directorio de uploads sin rastro. Con solicitudes concurrentes
      // tmp/ contiene subcarpetas ajenas y el rmdir benigno falla (ENOTEMPTY).
      await rmdir(join(this.directorioUploads, 'tmp')).catch(() => undefined);

      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // El mensaje público es genérico para no filtrar detalles internos;
      // el error original se registra con stack para diagnóstico.
      this.logger.error(
        'Fallo al almacenar imágenes de publicación',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'No fue posible almacenar las imágenes',
      );
    }
  }

  private async eliminarArchivos(
    archivosTemporales: string[],
    archivosFinales: string[],
  ): Promise<void> {
    await Promise.all(
      [...archivosTemporales, ...archivosFinales].map((ruta) =>
        rm(ruta, { force: true }).catch(() => undefined),
      ),
    );
  }

  getDirectorioUploads(): string {
    return this.directorioUploads;
  }

  getPrefijoUrl(): string {
    return PREFIJO_URL_IMAGENES;
  }
}
