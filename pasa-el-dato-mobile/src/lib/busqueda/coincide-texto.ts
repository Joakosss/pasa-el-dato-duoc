export function normalizarTextoBusqueda(valor: string): string {
  return valor.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function coincideTextoBusqueda(
  consulta: string,
  campos: string[],
  nombreVendedor: string,
): boolean {
  const texto = normalizarTextoBusqueda(consulta);
  if (!texto) return true;

  return normalizarTextoBusqueda(nombreVendedor).includes(texto)
    || normalizarTextoBusqueda(campos.join(' ')).includes(texto);
}
