const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DOMINIO_PERMITIDO = "@duocuc.cl";

export interface ValidacionCorreo {
  ok: boolean;
  error?: string;
  normalizado?: string;
}

export function normalizarCorreo(valor: string): string {
  return valor.trim().toLowerCase();
}

export function validarCorreoDuoc(valor: string): ValidacionCorreo {
  const normalizado = normalizarCorreo(valor);
  if (!normalizado) {
    return { ok: false, error: "Ingresa tu correo." };
  }
  if (!CORREO_RE.test(normalizado)) {
    return { ok: false, error: "Correo inválido." };
  }
  if (!normalizado.endsWith(DOMINIO_PERMITIDO)) {
    return { ok: false, error: `Solo correos ${DOMINIO_PERMITIDO}.` };
  }
  return { ok: true, normalizado };
}
