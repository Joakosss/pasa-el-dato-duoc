import type { PublicacionDetalle, PublicacionPublica } from '@/lib/api/publicaciones';

// TODO[MOMENTANEO]: eliminar estas publicaciones de demostración cuando existan
// suficientes avisos reales de otros usuarios para validar la vista de reportes.
export const PUBLICACIONES_DEMOSTRACION_MOMENTANEO: PublicacionPublica[] = [
  {
    id: 'momentaneo-publicacion-1',
    titulo: 'Audífonos inalámbricos SoundBeat',
    descripcion:
      'Audífonos Bluetooth con estuche de carga. Funcionan correctamente y tienen poco uso.',
    precio: 18000,
    estado: { id: 1, descripcion: 'En curso' },
    sede: { id: 9, nombre: 'Puente Alto' },
    tipoVenta: { id: 1, nombre: 'Producto' },
    categoria: { id: 1, nombre: 'Tecnología y accesorios' },
    imagenes: [],
  },
  {
    id: 'momentaneo-publicacion-2',
    titulo: 'Apuntes de programación web',
    descripcion:
      'Resumen completo de HTML, CSS y JavaScript para preparar evaluaciones y proyectos.',
    precio: 3500,
    estado: { id: 1, descripcion: 'En curso' },
    sede: { id: 2, nombre: 'Antonio Varas' },
    tipoVenta: { id: 1, nombre: 'Producto' },
    categoria: { id: 3, nombre: 'Insumos y materiales académicos' },
    imagenes: [],
  },
  {
    id: 'momentaneo-publicacion-3',
    titulo: 'Clases de Excel básico',
    descripcion:
      'Servicio de apoyo para aprender fórmulas, tablas dinámicas y gráficos desde cero.',
    precio: 12000,
    estado: { id: 1, descripcion: 'En curso' },
    sede: { id: 1, nombre: 'Alameda' },
    tipoVenta: { id: 2, nombre: 'Servicio' },
    categoria: { id: 7, nombre: 'Servicios académicos' },
    imagenes: [],
  },
  {
    id: 'momentaneo-publicacion-4',
    titulo: 'Mochila para notebook 15 pulgadas',
    descripcion:
      'Mochila en excelente estado, con compartimento acolchado y varios bolsillos.',
    precio: 15000,
    estado: { id: 1, descripcion: 'En curso' },
    sede: { id: 8, nombre: 'Plaza Vespucio' },
    tipoVenta: { id: 1, nombre: 'Producto' },
    categoria: { id: 5, nombre: 'Hogar y vida diaria' },
    imagenes: [],
  },
];

export function obtenerPublicacionDemostracionMomentaneo(
  id: string,
): PublicacionDetalle | undefined {
  return PUBLICACIONES_DEMOSTRACION_MOMENTANEO.find((publicacion) => publicacion.id === id);
}
