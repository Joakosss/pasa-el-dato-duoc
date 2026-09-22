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
