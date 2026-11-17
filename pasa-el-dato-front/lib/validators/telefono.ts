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

// Formato de UI `+56 9 3651 7901` (espejo de formatearTelefonoChile del
// mobile). El back guarda 8 dígitos sin prefijo, así que se recupera el 9.
export function formatearTelefonoChile(valor: string): string {
  let digitos = valor.replace(/\D/g, "");

  if (digitos.startsWith("56")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length === 8) {
    digitos = `9${digitos}`;
  }
  digitos = digitos.slice(0, 9);

  if (!digitos) return "";

  const grupos = [
    digitos.slice(0, 1),
    digitos.slice(1, 5),
    digitos.slice(5, 9),
  ].filter(Boolean);

  return `+56 ${grupos.join(" ")}`;
}
