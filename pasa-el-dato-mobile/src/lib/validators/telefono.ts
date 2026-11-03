export interface ValidacionTelefono {
  ok: boolean;
  error?: string;
  normalizado?: string;
}

/**
 * Convierte entradas móviles chilenas comunes a formato de UI:
 * `+56 9 3651 7901`.
 */
export function formatearTelefonoChile(valor: string): string {
  let digitos = valor.replace(/\D/g, '');

  if (digitos.startsWith('56')) {
    digitos = digitos.slice(2);
  }

  if (digitos.startsWith('9')) {
    digitos = digitos.slice(0, 9);
  } else {
    digitos = digitos.slice(0, 9);
  }

  if (!digitos) return '';

  const grupos = [
    digitos.slice(0, 1),
    digitos.slice(1, 5),
    digitos.slice(5, 9),
  ].filter(Boolean);

  return `+56 ${grupos.join(' ')}`;
}

/**
 * Devuelve el formato que recibe el backend: `+569XXXXXXXX`.
 */
export function normalizarTelefonoChile(valor: string): string | undefined {
  const digitos = valor.replace(/\D/g, '');
  const numeroNacional = digitos.startsWith('56') ? digitos.slice(2) : digitos;

  if (!/^9\d{8}$/.test(numeroNacional)) return undefined;

  return `+56${numeroNacional}`;
}

export function validarTelefonoChile(valor: string): ValidacionTelefono {
  const normalizado = normalizarTelefonoChile(valor);

  if (!normalizado) {
    return {
      ok: false,
      error: 'Ingresa un celular chileno válido, por ejemplo +56 9 3651 7901.',
    };
  }

  return { ok: true, normalizado };
}
