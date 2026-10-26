import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

export function obtenerDirectorioUploads(
  valor = process.env.UPLOAD_DIR,
): string {
  const directorio = valor?.trim() || DIRECTORIO_UPLOADS_POR_DEFECTO;
  return isAbsolute(directorio) ? resolve(directorio) : resolve(process.cwd(), directorio);
}

@Injectable()
export class AlmacenamientoImagenesService {
  private readonly directorioUploads = obtenerDirectorioUploads();

  async ejecutarConImagenesAlmacenadas<T>(
    imagenes: ImagenRecibida[],
    operacion: (
      imagenes: ImagenAlmacenada[],
    ) => Promise<T>,
  ): Promise<ResultadoOperacionAlmacenamiento<T>> {
    validarImagenesRecibidas(imagenes);

    const archivosTemporales: string[] = [];
    const archivosFinales: string[] = [];
    const imagenesAlmacenadas: ImagenAlmacenada[] = [];

    try {
      await mkdir(join(this.directorioUploads, 'tmp'), { recursive: true });

      for (const [indice, imagen] of imagenes.entries()) {
        const nombreArchivo = `${randomUUID()}${EXTENSIONES_POR_MIME[imagen.mimetype]}`;
        const rutaTemporal = join(this.directorioUploads, 'tmp', nombreArchivo);
        const rutaFinal = join(this.directorioUploads, nombreArchivo);
        archivosTemporales.push(rutaTemporal);

        await writeFile(rutaTemporal, imagen.buffer);
        await rename(rutaTemporal, rutaFinal);
        archivosFinales.push(rutaFinal);

        imagenesAlmacenadas.push({
          nombreArchivo,
          url: `${PREFIJO_URL_IMAGENES}/${nombreArchivo}`,
          orden: indice + 1,
        });
      }

      const resultado = await operacion(imagenesAlmacenadas);

      return { resultado, imagenes: imagenesAlmacenadas };
    } catch (error) {
      await this.eliminarArchivos(archivosTemporales, archivosFinales);

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

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
