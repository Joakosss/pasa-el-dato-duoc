export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export class ErrorConexion extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrorConexion";
  }
}

export interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>;
  accessToken?: string | null;
  esMultipart?: boolean;
  timeoutMs?: number;
  omitirRenovacion?: boolean;
}

export interface CoordinadorHttp {
  validarAcceso: (accessToken: string) => string;
  prepararAcceso: (accessToken: string) => Promise<string>;
  renovarAcceso: (accessToken: string) => Promise<string>;
}

function esFormData(valor: unknown): valor is FormData {
  if (typeof valor !== 'object' || valor === null) return false;
  if (typeof FormData !== 'undefined' && valor instanceof FormData) return true;
  return 'append' in valor && typeof valor.append === 'function' &&
    Object.prototype.toString.call(valor) === '[object FormData]';
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string, private readonly sesion?: CoordinadorHttp) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { query, accessToken, esMultipart = false, timeoutMs = 30_000,
      omitirRenovacion = false, signal, ...init } = options;
    const url = this.buildUrl(path, query);

    const enviar = async (token: string | null | undefined): Promise<Response> => {
      const controller = new AbortController();
      let vencio = false;
      const cancelar = () => controller.abort();
      if (signal?.aborted) cancelar();
      else signal?.addEventListener('abort', cancelar, { once: true });
      const timer = setTimeout(() => {
        vencio = true;
        controller.abort();
      }, timeoutMs);
      const headers = new Headers(init.headers ?? {});
      if (!headers.has("Content-Type") && init.body && !esMultipart && !esFormData(init.body)) {
        headers.set("Content-Type", "application/json");
      }
      if (token) headers.set("Authorization", `Bearer ${token}`);

      try {
        const respuesta = await fetch(url, { ...init, headers, signal: controller.signal });
        return respuesta;
      } catch {
        if (signal?.aborted) throw new ErrorConexion('La solicitud fue cancelada.');
        if (vencio) throw new ErrorConexion('La solicitud tardó demasiado. Comprueba el resultado antes de reintentar.');
        throw new ErrorConexion('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.');
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancelar);
      }
    };

    const validar = accessToken && !omitirRenovacion && this.sesion
      ? () => this.sesion!.validarAcceso(accessToken)
      : undefined;
    const tokenInicial = validar && this.sesion
      ? await this.sesion.prepararAcceso(accessToken!)
      : accessToken;
    if (signal?.aborted) throw new ErrorConexion('La solicitud fue cancelada.');
    if (validar && validar() !== tokenInicial) {
      throw new ErrorConexion('La sesión cambió. Vuelve a intentar la operación.');
    }
    let res = await enviar(tokenInicial);
    validar?.();

    let body: unknown = res.status === 204 ? null : await res.json().catch(() => null);
    validar?.();
    const mensajeSesion = typeof body === 'object' && body !== null &&
      'message' in body && body.message === 'Sesión inválida';
    if (res.status === 401 && tokenInicial && validar && mensajeSesion && this.sesion) {
      if (signal?.aborted) throw new ErrorConexion('La solicitud fue cancelada.');
      const renovado = await this.sesion.renovarAcceso(tokenInicial);
      if (signal?.aborted) throw new ErrorConexion('La solicitud fue cancelada.');
      validar();
      res = await enviar(renovado);
      validar();
      body = res.status === 204 ? null : await res.json().catch(() => null);
      validar();
    }
    if (res.status === 204) return undefined as T;
    if (!res.ok) {
      const message = typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : `No se pudo completar la solicitud (${res.status}).`;
      throw new ApiError(res.status, message, body);
    }
    return body as T;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: data === undefined ? undefined : esFormData(data) ? data : JSON.stringify(data),
    });
  }

  postFormData<T>(path: string, data: FormData, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body: data, esMultipart: true });
  }

  patchFormData<T>(path: string, data: FormData, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body: data, esMultipart: true });
  }

  put<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body: data === undefined ? undefined : JSON.stringify(data) });
  }

  patch<T>(path: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body: data === undefined ? undefined : JSON.stringify(data) });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}
