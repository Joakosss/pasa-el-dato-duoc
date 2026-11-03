export const MIN_CONTRASENA_MVP_LEN = 8;
export const MAX_CONTRASENA_MVP_LEN = 72;

export type ValidacionContrasenaMvp =
  | { ok: true }
  | { ok: false; codigo: 'VACIA' | 'MIN_LEN' | 'MAX_LEN' | 'TRIM' };

/**
 * Reglas MVP para contraseña:
 * - Largo entre 8 y 72.
 * - No permitir espacios al inicio/fin (para evitar confusión por copy/paste).
 * - No exigir complejidad (mayúsculas/números/símbolos) en MVP.
 */
export function validarContrasenaMvp(
  contrasena: string,
): ValidacionContrasenaMvp {
  if (typeof contrasena !== 'string' || contrasena.length === 0) {
    return { ok: false, codigo: 'VACIA' };
  }

  if (contrasena.trim() !== contrasena) {
    return { ok: false, codigo: 'TRIM' };
  }

  if (contrasena.length < MIN_CONTRASENA_MVP_LEN) {
    return { ok: false, codigo: 'MIN_LEN' };
  }

  if (contrasena.length > MAX_CONTRASENA_MVP_LEN) {
    return { ok: false, codigo: 'MAX_LEN' };
  }

  return { ok: true };
}

export function mensajeErrorContrasenaMvp(
  resultado: ValidacionContrasenaMvp,
): string {
  if (resultado.ok) return '';

  switch (resultado.codigo) {
    case 'VACIA':
      return 'La contraseña es obligatoria';
    case 'TRIM':
      return 'La contraseña no puede tener espacios al inicio o al final';
    case 'MIN_LEN':
      return `La contraseña debe tener al menos ${MIN_CONTRASENA_MVP_LEN} caracteres`;
    case 'MAX_LEN':
      return `La contraseña no puede exceder ${MAX_CONTRASENA_MVP_LEN} caracteres`;
  }
}
