const TELEFONO_RE = /^\d{8}$/;
const PREFIJO_MAS_569_RE = /^\+569\d{8}$/;
const PREFIJO_9_RE = /^9\d{8}$/;

export interface ValidacionTelefono {
  ok: boolean;
  error?: string;
  normalizado?: string;
}

// Espejo del back (RegistrarUsuarioDto): trim + recorte +569/9.
export function normalizarTelefono(valor: string): string {
  const telefono = valor.trim();
  if (PREFIJO_MAS_569_RE.test(telefono)) {
    return telefono.slice(4);
  }
  if (PREFIJO_9_RE.test(telefono)) {
    return telefono.slice(1);
  }
  return telefono;
}

export function validarTelefono(valor: string): ValidacionTelefono {
  const normalizado = normalizarTelefono(valor);
  if (!normalizado) {
    return { ok: false, error: "Ingresa tu teléfono." };
  }
  if (!TELEFONO_RE.test(normalizado)) {
    return { ok: false, error: "El teléfono debe tener 8 dígitos." };
  }
  return { ok: true, normalizado };
}
