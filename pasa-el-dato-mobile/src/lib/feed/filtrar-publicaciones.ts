import {
  CATEGORIAS_FEED,
  PUBLICACIONES_FEED,
  type PublicacionFeed,
} from '@/lib/feed/publicaciones-placeholder';

// Filtrado de la búsqueda sobre el placeholder del feed. Sin red: el backend
// todavía no expone publicaciones (solo auth, usuario, sede, escuela y carrera).
// TODO: reemplazar por la búsqueda real cuando exista el contrato de
// publicaciones. Sin reglas de orden ni relevancia: solo coincidencia de texto
// y categoría.

export interface FiltroBusqueda {
  texto: string;
  // id de CATEGORIAS_FEED. null busca en todas las categorías.
  categoriaId: string | null;
}

// Compara sin distinguir mayúsculas ni tildes ("electronica" encuentra
// "Electrónica"). Se limpia el rango de diacríticos combinantes para no depender
// de propiedades Unicode en el runtime móvil.
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Todas las palabras escritas deben aparecer en el contenido de la publicación.
function coincide(publicacion: PublicacionFeed, terminos: string[]): boolean {
  const contenido = normalizar(
    [
      publicacion.titulo,
      publicacion.descripcion,
      publicacion.categoria,
      publicacion.vendedor,
    ].join(' '),
  );

  return terminos.every((termino) => contenido.includes(termino));
}

export function filtrarPublicaciones(
  filtro: FiltroBusqueda,
): PublicacionFeed[] {
  // Un id de categoría desconocido no filtra: se comporta como "todas".
  const categoria = filtro.categoriaId
    ? CATEGORIAS_FEED.find((candidata) => candidata.id === filtro.categoriaId)
    : undefined;

  const terminos = normalizar(filtro.texto)
    .split(/\s+/)
    .filter((termino) => termino.length > 0);

  return PUBLICACIONES_FEED.filter((publicacion) => {
    if (categoria && publicacion.categoria !== categoria.etiqueta) {
      return false;
    }
    return coincide(publicacion, terminos);
  });
}
