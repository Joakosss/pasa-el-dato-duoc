const CORREO_COMERCIAL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidacionCorreoComercial {
  ok: boolean;
  error?: string;
  normalizado?: string;
}

export function normalizarCorreoComercial(valor: string): string {
  return valor.trim().toLowerCase();
}

// Correo comercial externo (marcas): solo valida formato, sin exigir dominio.
export function validarCorreoComercial(
  valor: string,
): ValidacionCorreoComercial {
  const normalizado = normalizarCorreoComercial(valor);
  if (!normalizado) {
    return { ok: false, error: "Ingresa el correo." };
  }
  if (!CORREO_COMERCIAL_RE.test(normalizado)) {
    return { ok: false, error: "Correo inválido." };
  }
  return { ok: true, normalizado };
}
