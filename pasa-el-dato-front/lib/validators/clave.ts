export interface ValidacionClave {
  ok: boolean;
  error?: string;
}

export function validarClave(clave: string, confirmacion: string): ValidacionClave {
  if (!clave) return { ok: false, error: "Ingresa una contraseña." };
  if (clave.length < 8) return { ok: false, error: "Mínimo 8 caracteres." };
  if (clave !== confirmacion) return { ok: false, error: "Las contraseñas no coinciden." };
  return { ok: true };
}

// Reglas MVP espejo del back (reglas-contrasena-mvp.ts): 8-72, sin espacios borde.
export const MIN_CLAVE_MVP = 8;
export const MAX_CLAVE_MVP = 72;

export function validarContrasenaMvp(clave: string): ValidacionClave {
  if (!clave) return { ok: false, error: "Ingresa una contraseña." };
  if (clave.trim() !== clave) {
    return {
      ok: false,
      error: "Sin espacios al inicio o al final.",
    };
  }
  if (clave.length < MIN_CLAVE_MVP) {
    return { ok: false, error: `Mínimo ${MIN_CLAVE_MVP} caracteres.` };
  }
  if (clave.length > MAX_CLAVE_MVP) {
    return { ok: false, error: `Máximo ${MAX_CLAVE_MVP} caracteres.` };
  }
  return { ok: true };
}

export interface ErroresCambioClave {
  actual?: string;
  nueva?: string;
  confirmacion?: string;
}

export function validarCambioClave(
  actual: string,
  nueva: string,
  confirmacion: string,
): { ok: boolean; errores: ErroresCambioClave } {
  const errores: ErroresCambioClave = {};

  if (!actual) {
    errores.actual = "Ingresa tu contraseña actual.";
  }

  const validacionNueva = validarContrasenaMvp(nueva);
  if (!validacionNueva.ok) {
    errores.nueva = validacionNueva.error;
  }

  if (!confirmacion) {
    errores.confirmacion = "Confirma tu nueva contraseña.";
  } else if (nueva !== confirmacion && validacionNueva.ok) {
    errores.confirmacion = "Las contraseñas no coinciden.";
  }

  return { ok: Object.keys(errores).length === 0, errores };
}
