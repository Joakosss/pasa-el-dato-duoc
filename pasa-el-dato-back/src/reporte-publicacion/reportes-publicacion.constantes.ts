// HU-REP-01: constantes del flujo de creación de reportes de publicación.
// Los nombres de estado coinciden con el catálogo estado_publicacion
// (seed-dev): 'En curso', 'Pausado', 'Vendido'.

// Longitud máxima de comentarios libres (igual que la advertencia admin).
export const REPORTE_COMENTARIO_MAX_LEN = 1000;

// HU-REP-01 (RN4): las pausadas no se pueden reportar; las eliminadas
// tampoco (eliminado=true). En curso y Vendido sí son reportables.
// Seed histórico dual: 'Pausado' (reportes) y 'Pausada' (web/chat).
export const ESTADO_NO_REPORTEABLE = 'Pausado';
export const ESTADOS_NO_REPORTEABLES = ['Pausado', 'Pausada'] as const;
export const ESTADOS_PUBLICACION_REPORTEABLES = ['En curso', 'Vendido'] as const;

// HU-REP-01 (RN6): un reporte bloquea el duplicado solo mientras está en curso.
export const ESTADOS_REPORTE_EN_CURSO = ['PENDIENTE', 'EN_PROCESO'] as const;
