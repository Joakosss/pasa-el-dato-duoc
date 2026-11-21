const API_DESARROLLO = 'http://10.0.2.2:3001/api';

export function validarApiUrl(configurada: string | undefined, desarrollo: boolean): string {
  const valor = configurada?.trim();
  if (!valor && !desarrollo) {
    throw new Error('Configura EXPO_PUBLIC_API_URL con una URL HTTPS para esta compilación.');
  }

  let url: URL;
  try {
    url = new URL(valor || API_DESARROLLO);
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL debe ser una URL HTTP o HTTPS válida.');
  }

  if (
    (url.protocol !== 'https:' && !(desarrollo && url.protocol === 'http:')) ||
    url.username || url.password || url.search || url.hash
  ) {
    throw new Error('EXPO_PUBLIC_API_URL requiere HTTPS fuera de desarrollo y no admite credenciales, consulta ni fragmento.');
  }

  return url.toString().replace(/\/+$/, '');
}
