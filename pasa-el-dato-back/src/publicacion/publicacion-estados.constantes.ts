// HU-COM-01: "Vendida" deja de ser asignable por este catálogo porque el
// cierre de venta (POST /publicaciones/:id/cierre-venta) es el único camino
// válido para marcar una publicación como vendida, ya que requiere registrar
// un comprador en la misma operación atómica.
export const ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO = [
  'En curso',
  'Pausada',
] as const;

export type EstadoPublicacionAsignablePorPropietario =
  (typeof ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO)[number];
