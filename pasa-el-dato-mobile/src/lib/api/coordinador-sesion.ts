import { ApiError, ErrorConexion } from './http-client';

export class ErrorRenovacionIncierta extends ErrorConexion {
  constructor() {
    super('No se pudo confirmar la renovación de sesión. Inicia sesión nuevamente.');
    this.name = 'ErrorRenovacionIncierta';
  }
}

export interface CredencialesSesion {
  accessToken: string;
  refreshToken: string;
}

export interface EstadoSesionActual {
  identidad: object;
  tokens: CredencialesSesion;
}

export interface DependenciasSesion {
  obtener: () => EstadoSesionActual | null;
  renovar: (refreshToken: string) => Promise<CredencialesSesion>;
  guardar: (tokens: CredencialesSesion) => Promise<void>;
  cerrar: () => void;
  descartar: (tokens: CredencialesSesion) => Promise<void>;
  leerMarcador: () => Promise<string | null>;
  guardarMarcador: (refreshToken: string) => Promise<void>;
  borrarMarcador: () => Promise<void>;
}

export function crearCoordinadorSesion(deps: DependenciasSesion) {
  let identidad: object | null = null;
  let tokensConocidos = new Set<string>();
  let pendiente: Promise<string> | null = null;
  let tokenIncierto: string | null = null;
  let cierreIdentidad: object | null = null;
  let colaMarcador: Promise<void> = Promise.resolve();

  function conMarcador<T>(operacion: () => Promise<T>): Promise<T> {
    const resultado = colaMarcador.then(operacion);
    colaMarcador = resultado.then(() => undefined, () => undefined);
    return resultado;
  }

  function validarAcceso(tokenSolicitado: string): string {
    const estado = deps.obtener();
    if (!estado) throw new ErrorConexion('La sesión ya no está disponible.');

    if (estado.identidad !== identidad) {
      identidad = estado.identidad;
      tokensConocidos = new Set([estado.tokens.accessToken]);
      pendiente = null;
      tokenIncierto = null;
    }

    if (tokenSolicitado !== estado.tokens.accessToken) {
      if (tokensConocidos.has(tokenSolicitado)) return estado.tokens.accessToken;
      throw new ErrorConexion('La sesión cambió. Vuelve a intentar la operación.');
    }
    return estado.tokens.accessToken;
  }

  async function prepararAcceso(tokenSolicitado: string): Promise<string> {
    validarAcceso(tokenSolicitado);
    const tarea = pendiente;
    if (tarea) await tarea;
    const tokenActual = validarAcceso(tokenSolicitado);
    const estado = deps.obtener();
    if (!estado) throw new ErrorConexion('La sesión ya no está disponible.');
    if (tokenIncierto === estado.tokens.refreshToken) {
      throw new ErrorRenovacionIncierta();
    }
    return tokenActual;
  }

  async function renovarAcceso(tokenSolicitado: string): Promise<string> {
    const tokenActual = validarAcceso(tokenSolicitado);
    const estado = deps.obtener();
    if (!estado) throw new ErrorConexion('La sesión ya no está disponible.');

    if (cierreIdentidad === estado.identidad) {
      throw new ErrorConexion('Se está cerrando la sesión. Intenta nuevamente.');
    }
    if (pendiente) return pendiente;
    if (tokenIncierto === estado.tokens.refreshToken) {
      throw new ErrorRenovacionIncierta();
    }
    if (tokenActual !== tokenSolicitado) return tokenActual;

    const identidadInicial = estado.identidad;
    const refreshInicial = estado.tokens.refreshToken;
    let enviada = false;
    const tarea = (async () => {
      try {
        await conMarcador(async () => {
          const marcador = await deps.leerMarcador();
          if (deps.obtener()?.identidad !== identidadInicial ||
              deps.obtener()?.tokens.refreshToken !== refreshInicial) {
            throw new ErrorConexion('La sesión cambió durante la renovación.');
          }
          if (marcador === refreshInicial) {
            tokenIncierto = refreshInicial;
            throw new ErrorRenovacionIncierta();
          }
          await deps.guardarMarcador(refreshInicial);
          if (deps.obtener()?.identidad !== identidadInicial ||
              deps.obtener()?.tokens.refreshToken !== refreshInicial) {
            throw new ErrorConexion('La sesión cambió durante la renovación.');
          }
        });
        if (deps.obtener()?.identidad !== identidadInicial ||
            deps.obtener()?.tokens.refreshToken !== refreshInicial) {
          throw new ErrorConexion('La sesión cambió durante la renovación.');
        }
        enviada = true;
        const renovados = await deps.renovar(refreshInicial);
        const actual = deps.obtener();
        if (!actual || actual.identidad !== identidadInicial || actual.tokens.refreshToken !== refreshInicial) {
          void deps.descartar(renovados).catch(() => undefined);
          throw new ErrorConexion('La sesión cambió durante la renovación.');
        }
        tokensConocidos.add(renovados.accessToken);
        try {
          await deps.guardar(renovados);
        } catch {
          const despues = deps.obtener();
          if (despues?.identidad === identidadInicial &&
              despues.tokens.refreshToken === renovados.refreshToken) {
            tokenIncierto = renovados.refreshToken;
            throw new ErrorRenovacionIncierta();
          }
          throw new ErrorConexion('La sesión cambió durante la renovación.');
        }
        const guardado = deps.obtener();
        if (!guardado || guardado.identidad !== identidadInicial ||
            guardado.tokens.refreshToken !== renovados.refreshToken) {
          throw new ErrorConexion('La sesión cambió durante la renovación.');
        }
        try {
          await conMarcador(async () => {
            const actual = deps.obtener();
            if (actual?.identidad === identidadInicial &&
                actual.tokens.refreshToken === renovados.refreshToken &&
                await deps.leerMarcador() === refreshInicial &&
                deps.obtener()?.identidad === identidadInicial &&
                deps.obtener()?.tokens.refreshToken === renovados.refreshToken) {
              await deps.borrarMarcador();
            }
          });
        } catch {
          // El marcador antiguo no coincide con el nuevo token persistido.
        }
        const final = deps.obtener();
        if (!final || final.identidad !== identidadInicial ||
            final.tokens.refreshToken !== renovados.refreshToken) {
          throw new ErrorConexion('La sesión cambió durante la renovación.');
        }
        return renovados.accessToken;
      } catch (error) {
        const actual = deps.obtener();
        const sigueVigente = actual?.identidad === identidadInicial &&
          actual.tokens.refreshToken === refreshInicial;
        if (sigueVigente && error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          deps.cerrar();
          throw new ErrorConexion('Tu sesión terminó. Inicia sesión nuevamente.');
        }
        if (sigueVigente && (enviada || error instanceof ErrorRenovacionIncierta)) {
          tokenIncierto = refreshInicial;
          throw new ErrorRenovacionIncierta();
        }
        if (sigueVigente) {
          throw new ErrorConexion('No se pudo preparar la renovación de sesión en el dispositivo. Intenta nuevamente.');
        }
        throw error;
      }
    })();
    pendiente = tarea;
    try {
      return await tarea;
    } finally {
      if (pendiente === tarea) pendiente = null;
    }
  }

  async function cerrarSesion(
    revocar: (tokens: CredencialesSesion) => Promise<void>,
  ): Promise<void> {
    const inicial = deps.obtener();
    if (!inicial) throw new ErrorConexion('La sesión ya no está disponible.');
    validarAcceso(inicial.tokens.accessToken);
    if (cierreIdentidad === inicial.identidad) {
      throw new ErrorConexion('Ya se está cerrando la sesión.');
    }

    cierreIdentidad = inicial.identidad;
    try {
      if (pendiente) await pendiente;
      const actual = deps.obtener();
      if (!actual || actual.identidad !== inicial.identidad) {
        throw new ErrorConexion('La sesión cambió durante el cierre.');
      }
      const marcador = await conMarcador(() => deps.leerMarcador());
      const antesDeRevocar = deps.obtener();
      if (!antesDeRevocar || antesDeRevocar.identidad !== inicial.identidad ||
          antesDeRevocar.tokens.refreshToken !== actual.tokens.refreshToken) {
        throw new ErrorConexion('La sesión cambió durante el cierre.');
      }
      if (tokenIncierto === actual.tokens.refreshToken || marcador === actual.tokens.refreshToken) {
        tokenIncierto = actual.tokens.refreshToken;
        throw new ErrorRenovacionIncierta();
      }
      await revocar(actual.tokens);
      const despues = deps.obtener();
      if (!despues || despues.identidad !== inicial.identidad ||
          despues.tokens.refreshToken !== actual.tokens.refreshToken) {
        throw new ErrorConexion('La sesión cambió durante el cierre.');
      }
      await conMarcador(async () => {
        const vigente = deps.obtener();
        if (!vigente || vigente.identidad !== inicial.identidad ||
            vigente.tokens.refreshToken !== actual.tokens.refreshToken) {
          throw new ErrorConexion('La sesión cambió durante el cierre.');
        }
        if (marcador !== null && await deps.leerMarcador() === marcador) {
          await deps.borrarMarcador();
        }
      });
      const final = deps.obtener();
      if (!final || final.identidad !== inicial.identidad ||
          final.tokens.refreshToken !== actual.tokens.refreshToken) {
        throw new ErrorConexion('La sesión cambió durante el cierre.');
      }
      deps.cerrar();
    } finally {
      if (cierreIdentidad === inicial.identidad) cierreIdentidad = null;
    }
  }

  function requiereReautenticacion(): boolean {
    const estado = deps.obtener();
    return estado !== null && estado.identidad === identidad &&
      estado.tokens.refreshToken === tokenIncierto;
  }

  return { validarAcceso, prepararAcceso, renovarAcceso, cerrarSesion, requiereReautenticacion };
}
