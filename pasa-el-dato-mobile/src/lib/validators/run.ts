export interface ValidacionRun {
  ok: boolean;
  error?: string;
  normalizado?: string;
}

function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let multiplicador = 2;

  for (let indice = cuerpo.length - 1; indice >= 0; indice -= 1) {
    suma += Number(cuerpo[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/**
 * Limpia la entrada en tiempo real sin insertar guiones. Solo permite
 * dígitos y K como posible dígito verificador final.
 */
export function limpiarRunEntrada(valor: string): string {
  const permitido = valor.toUpperCase().replace(/[^0-9K]/g, '');
  const cuerpo = permitido.slice(0, -1).replace(/K/g, '');
  const digitoVerificador = permitido.slice(-1);

  return `${cuerpo}${digitoVerificador}`.slice(0, 9);
}

/**
 * Inserta el guion solo cuando existe una cantidad suficiente de caracteres
 * para un RUN chileno. Así, al escribir 1 o 2 dígitos no se altera el cursor.
 */
export function formatearRunEnEscritura(valor: string): string {
  const limpio = limpiarRunEntrada(valor);

  if (limpio.length < 8) return limpio;

  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

/**
 * Normaliza el RUN para el contrato de la API: `12345678-5`.
 * También se utiliza al perder foco y antes de validar/enviar.
 */
export function formatearRun(valor: string): string {
  return formatearRunEnEscritura(valor);
}

export function validarRun(valor: string): ValidacionRun {
  const normalizado = formatearRun(valor);

  if (!normalizado) {
    return { ok: false, error: 'Ingresa tu RUT.' };
  }

  if (!/^\d{7,8}-[\dK]$/.test(normalizado)) {
    return { ok: false, error: 'Ingresa un RUT con formato 12345678-5.' };
  }

  const [cuerpo, digitoVerificador] = normalizado.split('-');
  if (calcularDigitoVerificador(cuerpo) !== digitoVerificador) {
    return { ok: false, error: 'El RUT ingresado no es válido.' };
  }

  return { ok: true, normalizado };
}
