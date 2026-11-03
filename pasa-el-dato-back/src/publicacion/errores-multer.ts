import { BadRequestException } from '@nestjs/common';
import { CAMPO_IMAGENES } from './imagenes.constantes.js';

// Estructura de un MulterError de multer 2.x. Se usa tipado estructural para
// no depender de los tipos de multer (el proyecto no declara @types/multer).
export interface ErrorMulter {
  name: string;
  code?: string;
  message?: string;
}

// Traduce errores de multer a BadRequestException con mensajes en español,
// según la tabla de errores de la especificación (sección 2.1). Los errores
// que no son de multer se devuelven intactos para su tratamiento normal.
export function traducirErrorMulter(error: unknown): unknown {
  const multer = error as ErrorMulter | undefined;

  if (multer?.name !== 'MulterError') {
    return error;
  }

  switch (multer.code) {
    case 'LIMIT_FILE_SIZE':
      return new BadRequestException('Imagen supera 5 MB');
    case 'LIMIT_UNEXPECTED_FILE':
      return new BadRequestException(
        `Los archivos deben enviarse en el campo ${CAMPO_IMAGENES} (máximo 5)`,
      );
    default:
      return new BadRequestException(
        `Error al procesar las imágenes: ${multer.message ?? 'desconocido'}`,
      );
  }
}
