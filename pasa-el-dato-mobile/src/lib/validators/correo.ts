const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DOMINIOS_INSTITUCIONALES = [
  '@duocuc.cl',
  '@profesor.duoc.cl',
  '@duoc.cl',
] as const;

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
    return { ok: false, error: 'Ingresa tu correo.' };
  }

  if (!CORREO_RE.test(normalizado)) {
    return { ok: false, error: 'Correo inválido.' };
  }

  if (!DOMINIOS_INSTITUCIONALES.some((dominio) => normalizado.endsWith(dominio))) {
    return {
      ok: false,
      error: 'El correo debe ser institucional Duoc UC (@duocuc.cl)',
    };
  }

  return { ok: true, normalizado };
}
