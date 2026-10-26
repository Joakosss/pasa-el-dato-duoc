// Constantes de imágenes de publicación (HU-PUB-01, T-06).
// Reglas de la HU: 1 a 5 imágenes, JPEG/PNG/WebP, 5 MB por archivo.

export const CANTIDAD_MINIMA_IMAGENES = 1;
export const CANTIDAD_MAXIMA_IMAGENES = 5;
export const TAMANO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

export const MIMES_IMAGEN_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const CAMPO_IMAGENES = 'imagenes';
