const RUT_RE = /^[0-9]{7,8}-[0-9K]$/;

export function normalizarRun(valor: string): string {
  const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}

export function calcularDv(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

function esCuerpoRepetido(cuerpo: string): boolean {
  return cuerpo.split("").every((d) => d === cuerpo[0]);
}

export interface ValidacionRut {
  ok: boolean;
  error?: string;
  normalizado?: string;
}

export function validarRun(valor: string): ValidacionRut {
  const normalizado = normalizarRun(valor);
  if (!normalizado || normalizado.length < 2) {
    return { ok: false, error: "Ingresa tu RUT." };
  }
  if (!RUT_RE.test(normalizado)) {
    return { ok: false, error: "Formato inválido. Ej: 12.345.678-5." };
  }
  const [cuerpo, dv] = normalizado.split("-");
  if (esCuerpoRepetido(cuerpo)) {
    return { ok: false, error: "RUT inválido." };
  }
  if (calcularDv(cuerpo) !== dv) {
    return { ok: false, error: "Dígito verificador inválido." };
  }
  return { ok: true, normalizado };
}
