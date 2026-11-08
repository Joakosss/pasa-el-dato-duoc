import { BadRequestException } from '@nestjs/common';
import { firmaImagenValida } from '../publicacion/firma-imagen.js';
import {
  MIMES_IMAGEN_PERMITIDOS,
  TAMANO_MAXIMO_IMAGEN_BYTES,
} from '../publicacion/imagenes.constantes.js';

export interface ImagenBannerRecibida {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const CAMPO_IMAGEN_BANNER = 'imagen';

export function validarImagenBanner(
  imagen: ImagenBannerRecibida | undefined,
): ImagenBannerRecibida {
  if (!imagen) {
    throw new BadRequestException('La imagen es obligatoria');
  }

  if (imagen.fieldname !== CAMPO_IMAGEN_BANNER) {
    throw new BadRequestException(
      `La imagen debe enviarse en el campo ${CAMPO_IMAGEN_BANNER}`,
    );
  }

  if (imagen.size > TAMANO_MAXIMO_IMAGEN_BYTES) {
    throw new BadRequestException('La imagen no puede superar los 5 MB');
  }

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

  return imagen;
}
