import type { BorradorPublicacion } from "./tipos";

export const CANTIDAD_MINIMA_IMAGENES = 1;
export const CANTIDAD_MAXIMA_IMAGENES = 5;
export const TAMANO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

export const MIMES_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type CampoBorrador =
  | "titulo"
  | "descripcion"
  | "precio"
  | "categoriaId"
  | "sedeId"
  | "imagenes";

export interface ResultadoValidacion {
  errores: Partial<Record<CampoBorrador, string>>;
  errorGeneral: string | null;
  valido: boolean;
}

interface OpcionesValidacion {
  tipoVentaId: number | null;
  // En edición, no elegir fotos nuevas significa conservar las actuales.
  permitirSinImagenes?: boolean;
}

// Espejo de las reglas de CrearPublicacionDto + validarImagenesRecibidas.
// No reemplaza la validación del backend, solo evita viajes innecesarios.
export function validarBorrador(
  borrador: BorradorPublicacion,
  opciones: OpcionesValidacion,
): ResultadoValidacion {
  const errores: Partial<Record<CampoBorrador, string>> = {};

  const titulo = borrador.titulo.trim();
  if (titulo.length < 5 || titulo.length > 100) {
    errores.titulo = "El título debe tener entre 5 y 100 caracteres.";
  }

  const descripcion = borrador.descripcion.trim();
  if (descripcion.length < 20 || descripcion.length > 2000) {
    errores.descripcion =
      "La descripción debe tener entre 20 y 2.000 caracteres.";
  }

  const precio = Number(borrador.precio);
  if (!Number.isInteger(precio) || precio < 1) {
    errores.precio = "El precio debe ser un número entero mayor que cero.";
  }

  if (!borrador.categoriaId) {
    errores.categoriaId = "Selecciona una categoría.";
  }

  if (!borrador.sedeId) {
    errores.sedeId = "Selecciona una sede.";
  }

  if (borrador.imagenes.length === 0 && opciones.permitirSinImagenes) {
    // Conserva las imágenes actuales de la publicación.
  } else if (borrador.imagenes.length < CANTIDAD_MINIMA_IMAGENES) {
    errores.imagenes = "Debes adjuntar al menos una imagen.";
  } else if (borrador.imagenes.length > CANTIDAD_MAXIMA_IMAGENES) {
    errores.imagenes = `Puedes adjuntar hasta ${CANTIDAD_MAXIMA_IMAGENES} imágenes.`;
  } else {
    const imagenInvalida = borrador.imagenes.find(
      (imagen) =>
        !MIMES_IMAGEN_PERMITIDOS.includes(
          imagen.type as (typeof MIMES_IMAGEN_PERMITIDOS)[number],
        ) || imagen.size > TAMANO_MAXIMO_IMAGEN_BYTES,
    );
    if (imagenInvalida) {
      errores.imagenes =
        "Cada imagen debe ser JPEG, PNG o WebP y pesar como máximo 5 MB.";
    }
  }

  const errorGeneral =
    opciones.tipoVentaId === null
      ? "No pudimos determinar el tipo de venta. Reintenta."
      : null;

  return {
    errores,
    errorGeneral,
    valido: Object.keys(errores).length === 0 && errorGeneral === null,
  };
}
