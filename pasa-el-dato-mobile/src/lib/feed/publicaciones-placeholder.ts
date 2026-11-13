import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

// Placeholder gráfico del feed y del detalle de producto. No hay contrato back
// vigente: el backend solo expone auth, usuario, sede, escuela y carrera, y no
// existe todavía el modelo de publicación. Los datos viven en el cliente.
// TODO: reemplazar por el listado real cuando exista el contrato de
// publicaciones (mismo criterio que el mock temporal del front web).
// Sin red, sin reglas de negocio.

export type NombreIcono = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface CategoriaFeed {
  id: string;
  etiqueta: string;
  icono: NombreIcono;
}

// Tipo de venta y condición según los requerimientos de publicaciones
// (producto o servicio; nuevo o usado).
export type TipoPublicacion = 'Producto' | 'Servicio';
export type CondicionPublicacion = 'Nuevo' | 'Usado' | 'No aplica';

export interface PublicacionFeed {
  id: string;
  categoria: string;
  titulo: string;
  // Resumen corto que muestra la tarjeta del feed.
  detalle: string;
  precio: string;
  vendedor: string;
  // Destacado pagado: en el diseño web se marca con borde dorado y etiqueta.
  patrocinada?: boolean;
  // Campos del detalle de producto (mismo placeholder, sin contrato back).
  descripcion: string;
  tipo: TipoPublicacion;
  condicion: CondicionPublicacion;
  // Catálogo real de sedes del entorno de desarrollo.
  sede: string;
}

// Catálogos de la creación de publicación (CU005: el usuario elige categoría,
// tipo de venta y sede). El tipo de venta sale del modelo vigente y la sede es
// el único registro del catálogo de desarrollo.
// TODO: cargar los catálogos reales cuando se conecte el contrato (el backend
// ya expone la lista de sedes).
export const TIPOS_VENTA: readonly TipoPublicacion[] = ['Producto', 'Servicio'];
export const SEDES_PUBLICACION: readonly string[] = ['Puente Alto'];

// Mismas categorías que el buscador del front web.
export const CATEGORIAS_FEED: CategoriaFeed[] = [
  { id: 'libros', etiqueta: 'Libros y apuntes', icono: 'book-open-variant' },
  { id: 'electronica', etiqueta: 'Electrónica', icono: 'laptop' },
  {
    id: 'servicios',
    etiqueta: 'Servicios académicos',
    icono: 'notebook-check-outline',
  },
  { id: 'ropa', etiqueta: 'Ropa y accesorios', icono: 'tshirt-crew-outline' },
  { id: 'arriendos', etiqueta: 'Arriendos', icono: 'home-city-outline' },
  { id: 'arte', etiqueta: 'Arte y diseño', icono: 'palette-outline' },
];

// Seis elementos para que la grilla de dos columnas quede siempre completa.
export const PUBLICACIONES_FEED: PublicacionFeed[] = [
  {
    id: 'demo-1',
    categoria: 'Libros y apuntes',
    titulo: 'Cálculo diferencial: apuntes y guía de ejercicios',
    detalle: 'Usado · Sede Puente Alto',
    precio: '$12.000',
    vendedor: 'Ana Soto',
    descripcion:
      'Apuntes del semestre con ejercicios resueltos y guías de estudio. Incluye anotaciones y subrayados en los capítulos principales.',
    tipo: 'Producto',
    condicion: 'Usado',
    sede: 'Puente Alto',
  },
  {
    id: 'demo-2',
    categoria: 'Electrónica',
    titulo: 'Calculadora científica programable',
    detalle: 'Usado · Sede Puente Alto',
    precio: '$25.000',
    vendedor: 'Diego Pérez',
    patrocinada: true,
    descripcion:
      'Calculadora con funciones científicas y gráficas. Incluye funda y manual de uso.',
    tipo: 'Producto',
    condicion: 'Usado',
    sede: 'Puente Alto',
  },
  {
    id: 'demo-3',
    categoria: 'Ropa y accesorios',
    titulo: 'Polerón institucional talla M',
    detalle: 'Nuevo · Sede Puente Alto',
    precio: '$18.000',
    vendedor: 'Camila Rojas',
    descripcion:
      'Polerón institucional talla M sin uso. Ideal para clases y actividades en el campus.',
    tipo: 'Producto',
    condicion: 'Nuevo',
    sede: 'Puente Alto',
  },
  {
    id: 'demo-4',
    categoria: 'Servicios académicos',
    titulo: 'Apoyo con informes y formato de entrega',
    detalle: 'Servicio · Sede Puente Alto',
    precio: '$8.000',
    vendedor: 'Matías Silva',
    descripcion:
      'Apoyo en la redacción y en el formato de entrega de informes y trabajos. Revisión de estructura y citas.',
    tipo: 'Servicio',
    condicion: 'No aplica',
    sede: 'Puente Alto',
  },
  {
    id: 'demo-5',
    categoria: 'Arte y diseño',
    titulo: 'Kit de marcadores para dibujo técnico',
    detalle: 'Usado · Sede Puente Alto',
    precio: '$9.500',
    vendedor: 'Fernanda Díaz',
    descripcion:
      'Set de marcadores para dibujo técnico con poco uso. Incluye estuche y regla.',
    tipo: 'Producto',
    condicion: 'Usado',
    sede: 'Puente Alto',
  },
  {
    id: 'demo-6',
    categoria: 'Arriendos',
    titulo: 'Arriendo de proyector para exposiciones',
    detalle: 'Servicio · Sede Puente Alto',
    precio: '$15.000',
    vendedor: 'Javier Muñoz',
    descripcion:
      'Proyector disponible para exposiciones y presentaciones. Se coordina el retiro y la devolución.',
    tipo: 'Servicio',
    condicion: 'No aplica',
    sede: 'Puente Alto',
  },
];

// Publicación del detalle. Devuelve undefined si el id no existe, para que la
// pantalla pueda mostrar un estado "no encontrada" en vez de fallar.
export function buscarPublicacion(id: string): PublicacionFeed | undefined {
  return PUBLICACIONES_FEED.find((publicacion) => publicacion.id === id);
}

// Relacionadas del detalle: el resto del catálogo placeholder. El orden no
// implementa recomendación (eso pertenece al dominio de recomendaciones).
export function publicacionesRelacionadas(
  id: string,
  cantidad: number,
): PublicacionFeed[] {
  return PUBLICACIONES_FEED.filter((publicacion) => publicacion.id !== id).slice(
    0,
    cantidad,
  );
}
