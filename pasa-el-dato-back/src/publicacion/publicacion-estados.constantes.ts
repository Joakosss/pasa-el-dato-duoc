export const ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO = [
  'En curso',
  'Pausada',
  'Vendida',
] as const;

export type EstadoPublicacionAsignablePorPropietario =
  (typeof ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO)[number];
