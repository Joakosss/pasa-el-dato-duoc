import {
  CATEGORIAS_FEED,
  SEDES_PUBLICACION,
  TIPOS_VENTA,
  type TipoPublicacion,
} from '@/lib/feed/publicaciones-placeholder';

// Reglas de creación tomadas de HU-PUB-01 (MVP aprobado): título 5-100,
// descripción 20-2.000, precio obligatorio en CLP mayor a $0 (sin "gratis" ni
// "a convenir"), sede/tipo de venta/categoría de catálogo y entre 1 y 5 imágenes
// JPEG, PNG o WebP de hasta 5 MB cada una.
// Sin red: el contrato de publicaciones todavía no existe, así que estas reglas
// viven en el cliente y la pantalla solo simula el envío.

export const TITULO_MIN = 5;
export const TITULO_MAX = 100;
export const DESCRIPCION_MIN = 20;
export const DESCRIPCION_MAX = 2000;
export const IMAGENES_MIN = 1;
export const IMAGENES_MAX = 5;
export const PESO_MAX_IMAGEN_MB = 5;
export const FORMATOS_IMAGEN: readonly string[] = ['JPEG', 'PNG', 'WebP'];

export interface ValidacionCampo {
  ok: boolean;
  error?: string;
}

export interface FormularioPublicacion {
  titulo: string;
  precio: string;
  categoria: string | null;
  tipo: TipoPublicacion | null;
  sede: string | null;
  descripcion: string;
  imagenes: number;
}

export type CampoPublicacion = keyof FormularioPublicacion;
export type ErroresPublicacion = Partial<Record<CampoPublicacion, string>>;

// Precio en CLP: se aceptan "$12.000", "12.000" o "12000"; los separadores se
// ignoran porque CLP no usa decimales.
export function precioEnClp(valor: string): number {
  const soloDigitos = valor.replace(/\D/g, '');
  return soloDigitos.length > 0 ? Number(soloDigitos) : 0;
}

export function validarTitulo(valor: string): ValidacionCampo {
  const titulo = valor.trim();

  if (!titulo) {
    return { ok: false, error: 'Ingresa el título de la publicación.' };
  }
  if (titulo.length < TITULO_MIN) {
    return {
      ok: false,
      error: `El título debe tener al menos ${TITULO_MIN} caracteres.`,
    };
  }
  if (titulo.length > TITULO_MAX) {
    return {
      ok: false,
      error: `El título no puede superar los ${TITULO_MAX} caracteres.`,
    };
  }

  return { ok: true };
}

export function validarDescripcion(valor: string): ValidacionCampo {
  const descripcion = valor.trim();

  if (!descripcion) {
    return { ok: false, error: 'Ingresa una descripción.' };
  }
  if (descripcion.length < DESCRIPCION_MIN) {
    return {
      ok: false,
      error: `La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres.`,
    };
  }
  if (descripcion.length > DESCRIPCION_MAX) {
    return {
      ok: false,
      error: `La descripción no puede superar los ${DESCRIPCION_MAX} caracteres.`,
    };
  }

  return { ok: true };
}

export function validarPrecio(valor: string): ValidacionCampo {
  const precio = valor.trim();

  if (!precio) {
    return { ok: false, error: 'Ingresa el precio.' };
  }
  if (/gratis|a\s*convenir/i.test(precio)) {
    return {
      ok: false,
      error: 'El precio debe ser un monto en CLP: no se permite "gratis" ni "a convenir".',
    };
  }
  if (precioEnClp(precio) <= 0) {
    return { ok: false, error: 'El precio debe ser un monto en CLP mayor a $0.' };
  }

  return { ok: true };
}

// Las categorías se comparan por etiqueta: es el valor que guarda la publicación.
export function validarCategoria(valor: string | null): ValidacionCampo {
  if (!valor) {
    return { ok: false, error: 'Selecciona una categoría.' };
  }
  if (!CATEGORIAS_FEED.some((categoria) => categoria.etiqueta === valor)) {
    return { ok: false, error: 'La categoría seleccionada no está disponible.' };
  }

  return { ok: true };
}

export function validarTipoVenta(valor: TipoPublicacion | null): ValidacionCampo {
  if (!valor) {
    return { ok: false, error: 'Selecciona si ofreces un producto o un servicio.' };
  }
  if (!TIPOS_VENTA.includes(valor)) {
    return { ok: false, error: 'El tipo de venta seleccionado no está disponible.' };
  }

  return { ok: true };
}

export function validarSede(valor: string | null): ValidacionCampo {
  if (!valor) {
    return { ok: false, error: 'Selecciona la sede.' };
  }
  if (!SEDES_PUBLICACION.includes(valor)) {
    return { ok: false, error: 'La sede seleccionada no está disponible.' };
  }

  return { ok: true };
}

export function validarImagenes(cantidad: number): ValidacionCampo {
  if (cantidad < IMAGENES_MIN) {
    return { ok: false, error: 'Adjunta al menos una imagen.' };
  }
  if (cantidad > IMAGENES_MAX) {
    return { ok: false, error: `Puedes adjuntar hasta ${IMAGENES_MAX} imágenes.` };
  }

  return { ok: true };
}

// Devuelve un error por campo para que el formulario marque cada uno.
export function validarFormularioPublicacion(
  datos: FormularioPublicacion,
): ErroresPublicacion {
  const validaciones: [CampoPublicacion, ValidacionCampo][] = [
    ['titulo', validarTitulo(datos.titulo)],
    ['precio', validarPrecio(datos.precio)],
    ['categoria', validarCategoria(datos.categoria)],
    ['tipo', validarTipoVenta(datos.tipo)],
    ['sede', validarSede(datos.sede)],
    ['descripcion', validarDescripcion(datos.descripcion)],
    ['imagenes', validarImagenes(datos.imagenes)],
  ];

  const errores: ErroresPublicacion = {};

  for (const [campo, validacion] of validaciones) {
    if (!validacion.ok && validacion.error) {
      errores[campo] = validacion.error;
    }
  }

  return errores;
}

export function hayErrores(errores: ErroresPublicacion): boolean {
  return Object.keys(errores).length > 0;
}
