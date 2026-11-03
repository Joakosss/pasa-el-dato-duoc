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
  categoriaId?: number;
  tipoVentaId?: number;
  sedeId?: number;
  descripcion: string;
  imagenes: number;
}

export type CampoPublicacion = keyof FormularioPublicacion;
export type ErroresPublicacion = Partial<Record<CampoPublicacion, string>>;

export function precioEnClp(valor: string): number {
  const soloDigitos = valor.replace(/\D/g, '');
  return soloDigitos.length > 0 ? Number(soloDigitos) : 0;
}

export function formatearPrecioClp(valor: string): string {
  const precio = precioEnClp(valor);

  return precio > 0 ? new Intl.NumberFormat('es-CL').format(precio) : '';
}

export function validarTitulo(valor: string): ValidacionCampo {
  const titulo = valor.trim();

  if (!titulo) return { ok: false, error: 'Ingresa el título de la publicación.' };
  if (titulo.length < TITULO_MIN) {
    return { ok: false, error: `El título debe tener al menos ${TITULO_MIN} caracteres.` };
  }
  if (titulo.length > TITULO_MAX) {
    return { ok: false, error: `El título no puede superar los ${TITULO_MAX} caracteres.` };
  }

  return { ok: true };
}

export function validarDescripcion(valor: string): ValidacionCampo {
  const descripcion = valor.trim();

  if (!descripcion) return { ok: false, error: 'Ingresa una descripción.' };
  if (descripcion.length < DESCRIPCION_MIN) {
    return { ok: false, error: `La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres.` };
  }
  if (descripcion.length > DESCRIPCION_MAX) {
    return { ok: false, error: `La descripción no puede superar los ${DESCRIPCION_MAX} caracteres.` };
  }

  return { ok: true };
}

export function validarPrecio(valor: string): ValidacionCampo {
  const precio = valor.trim();

  if (!precio) return { ok: false, error: 'Ingresa el precio.' };
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

function validarSeleccion(id: number | undefined, etiqueta: string): ValidacionCampo {
  return id && id > 0 ? { ok: true } : { ok: false, error: `Selecciona ${etiqueta}.` };
}

export function validarImagenes(cantidad: number): ValidacionCampo {
  if (cantidad < IMAGENES_MIN) return { ok: false, error: 'Adjunta al menos una imagen.' };
  if (cantidad > IMAGENES_MAX) {
    return { ok: false, error: `Puedes adjuntar hasta ${IMAGENES_MAX} imágenes.` };
  }

  return { ok: true };
}

export function validarFormularioPublicacion(
  datos: FormularioPublicacion,
): ErroresPublicacion {
  const validaciones: [CampoPublicacion, ValidacionCampo][] = [
    ['titulo', validarTitulo(datos.titulo)],
    ['precio', validarPrecio(datos.precio)],
    ['categoriaId', validarSeleccion(datos.categoriaId, 'una categoría')],
    ['tipoVentaId', validarSeleccion(datos.tipoVentaId, 'un tipo de venta')],
    ['sedeId', validarSeleccion(datos.sedeId, 'una sede')],
    ['descripcion', validarDescripcion(datos.descripcion)],
    ['imagenes', validarImagenes(datos.imagenes)],
  ];

  const errores: ErroresPublicacion = {};

  for (const [campo, validacion] of validaciones) {
    if (!validacion.ok && validacion.error) errores[campo] = validacion.error;
  }

  return errores;
}

export function hayErrores(errores: ErroresPublicacion): boolean {
  return Object.keys(errores).length > 0;
}
