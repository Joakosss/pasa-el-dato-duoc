import { ApiError, ErrorConexion } from './http-client';

export interface ErrorDetallePublicacion {
  mensaje: string;
  reintentable: boolean;
}

export function clasificarErrorDetallePublicacion(causa: unknown): ErrorDetallePublicacion {
  if (causa instanceof ApiError) {
    if (causa.status === 404) {
      return { mensaje: 'Esta publicación ya no está disponible.', reintentable: false };
    }
    return {
      mensaje: causa.message,
      reintentable: causa.status === 408 || causa.status === 429 || causa.status >= 500,
    };
  }
  return {
    mensaje: causa instanceof ErrorConexion ? causa.message : 'No pudimos cargar la publicación. Reintenta.',
    reintentable: true,
  };
}
