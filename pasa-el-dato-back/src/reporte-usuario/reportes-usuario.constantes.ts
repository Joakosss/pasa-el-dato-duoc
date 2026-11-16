// HU-REP-02: constantes del flujo de creación de reportes de usuario.

// Longitud máxima de comentarios libres (igual que las advertencias admin).
export const REPORTE_USUARIO_COMENTARIO_MAX_LEN = 1000;

// HU-REP-02 (RN6): un reporte bloquea el duplicado solo mientras está en curso.
export const ESTADOS_REPORTE_USUARIO_EN_CURSO = [
  'PENDIENTE',
  'EN_PROCESO',
] as const;
