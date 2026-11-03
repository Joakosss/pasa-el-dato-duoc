import { BadRequestException } from '@nestjs/common';
import { firmaImagenValida } from './firma-imagen.js';
import {
  CAMPO_IMAGENES,
  CANTIDAD_MAXIMA_IMAGENES,
  CANTIDAD_MINIMA_IMAGENES,
  MIMES_IMAGEN_PERMITIDOS,
} from './imagenes.constantes.js';

// Archivo recibido por multer (FilesInterceptor). Interfaz propia: el proyecto
// no declara @types/multer y solo se usan estos campos.
export interface ImagenRecibida {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Verifica cantidad 1..5, MIME permitido y firma real (magic bytes) de cada
// archivo. Lanza BadRequestException con mensaje claro; no toca el disco.
export function validarImagenesRecibidas(
  imagenes: ImagenRecibida[],
): ImagenRecibida[] {
  if (
    imagenes.length < CANTIDAD_MINIMA_IMAGENES ||
    imagenes.length > CANTIDAD_MAXIMA_IMAGENES
  ) {
    throw new BadRequestException(
      `Debe adjuntar entre ${CANTIDAD_MINIMA_IMAGENES} y ${CANTIDAD_MAXIMA_IMAGENES} imágenes`,
    );
  }

  for (const imagen of imagenes) {
    if (
      !MIMES_IMAGEN_PERMITIDOS.includes(
        imagen.mimetype as (typeof MIMES_IMAGEN_PERMITIDOS)[number],
      )
    ) {
      throw new BadRequestException(
        `Formato de imagen no permitido: ${imagen.originalname}`,
      );
    }

    if (!firmaImagenValida(imagen.buffer, imagen.mimetype)) {
      throw new BadRequestException(
        `Formato de imagen no permitido: ${imagen.originalname}`,
      );
    }
  }

  return imagenes;
}

// El campo de archivos debe llamarse exactamente como CAMPO_IMAGENES.
export function asegurarCampoImagenes(imagenes: ImagenRecibida[]): void {
  for (const imagen of imagenes) {
    if (imagen.fieldname !== CAMPO_IMAGENES) {
      throw new BadRequestException(
        `Los archivos deben enviarse en el campo ${CAMPO_IMAGENES}`,
      );
    }
  }
}
