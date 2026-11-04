import { env } from "@/config/env";

// El back devuelve URLs relativas tipo /api/uploads/<archivo>. Se resuelven
// contra el origen de la API para no duplicar el prefijo /api.
export function resolverUrlApi(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const origen = new URL(env.apiUrl).origin;
  return new URL(url, origen).toString();
}
