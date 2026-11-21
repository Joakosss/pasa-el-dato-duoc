import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LoginResponseDTO } from '@/domain/dtos/auth.dto';
import { almacenamientoSeguro } from '@/lib/storage/secure-storage';

// Tokens de sesión. Solo viven aquí y en el almacenamiento cifrado del
// dispositivo: nunca se registran en logs ni se muestran en la UI.
export interface TokensSesion {
  accessToken: string;
  refreshToken: string;
}

// Datos de sesión que la UI puede leer sin exponer tokens ni RUN.
export interface Sesion {
  idCuenta: string;
  correo: string;
  nombreCompleto: string;
  rol: {
    id: number;
    descripcion: string;
  };
}

interface SesionState {
  sesion: Sesion | null;
  tokens: TokensSesion | null;
  // true cuando terminó la lectura del almacenamiento seguro al arrancar.
  // Hasta entonces no se sabe si hay sesión guardada.
  hasHydrated: boolean;
  marcarHidratado: () => void;
  iniciarSesion: (dto: LoginResponseDTO) => Promise<void>;
  renovarTokens: (tokens: TokensSesion) => Promise<void>;
  cerrarSesion: () => void;
}

function construirNombreCompleto(
  usuario: LoginResponseDTO['usuario'],
): string {
  return [usuario.pNombre, usuario.sNombre, usuario.pApellido, usuario.sApellido]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(' ');
}

const CLAVE_SESION = 'pasaeldato.sesion.v1';
let escrituraConfirmada: string | null = null;
let generacionCierre = 0;

const almacenamientoSesion = {
  ...almacenamientoSeguro,
  setItem: (nombre: string, valor: string) => {
    if (nombre === CLAVE_SESION && valor === escrituraConfirmada) {
      escrituraConfirmada = null;
      return Promise.resolve();
    }
    return almacenamientoSeguro.setItem(nombre, valor);
  },
};

// Declarada como función para poder referenciar el store ya inicializado
// desde la acción cerrarSesion (se ejecuta en runtime, nunca al importar).
function borrarPersistencia(): void {
  void useSesionStore.persist.clearStorage();
}

export const useSesionStore = create<SesionState>()(
  persist(
    (set, get) => ({
      sesion: null,
      tokens: null,
      hasHydrated: false,
      marcarHidratado: () => set({ hasHydrated: true }),
      iniciarSesion: async (dto) => {
        const cierreInicial = generacionCierre;
        const { sesion: sesionAnterior, tokens: tokensAnteriores } = get();
        const sesion = {
          idCuenta: dto.idCuenta,
          correo: dto.correo,
          nombreCompleto: construirNombreCompleto(dto.usuario),
          rol: {
            id: dto.usuario.rol.id,
            descripcion: dto.usuario.rol.descripcion,
          },
        };
        const tokens = { accessToken: dto.accessToken, refreshToken: dto.refreshToken };
        const valorConfirmado = JSON.stringify({ state: { sesion, tokens }, version: 0 });
        await almacenamientoSeguro.setItem(CLAVE_SESION, valorConfirmado);
        if (generacionCierre !== cierreInicial ||
            get().sesion !== sesionAnterior || get().tokens !== tokensAnteriores) {
          await (set({}) as unknown as Promise<void>);
          throw new Error('La sesión cambió durante el ingreso.');
        }
        // La escritura anterior ya confirmó exactamente este estado.
        escrituraConfirmada = valorConfirmado;
        try {
          set({ sesion, tokens });
        } finally {
          escrituraConfirmada = null;
        }
      },
      // persist devuelve la operación de escritura, aunque el tipo de set sea void.
      renovarTokens: (tokens) => set({ tokens }) as unknown as Promise<void>,
      cerrarSesion: () => {
        generacionCierre += 1;
        // Deja el estado en memoria vacío (sin tokens ni identidad)...
        set({ sesion: null, tokens: null });
        // ...y además elimina la entrada persistida en SecureStore.
        borrarPersistencia();
      },
    }),
    {
      // La clave evita ":" porque SecureStore solo admite alfanuméricos,
      // ".", "-" y "_" (el front usa localStorage y puede permitírselo).
      name: CLAVE_SESION,
      storage: createJSONStorage(() => almacenamientoSesion),
      // Persiste solo el slice de datos; acciones y hasHydrated no se serializan.
      partialize: (estado) => ({
        sesion: estado.sesion,
        tokens: estado.tokens,
      }),
      // Se ejecuta al terminar la lectura, haya o no sesión guardada. En el
      // camino de error el estado llega undefined, así que se usa el capturado
      // antes de hidratar para no dejar la app esperando para siempre.
      onRehydrateStorage: (estado) => (rehidratado, error) => {
        if (error) {
          console.warn('No se pudo leer la sesión guardada', error);
        }
        (rehidratado ?? estado).marcarHidratado();
      },
    },
  ),
);

export const selectSesion = (estado: SesionState) => estado.sesion;
export const selectEstaAutenticado = (estado: SesionState) =>
  estado.sesion !== null;
export const selectRol = (estado: SesionState) => estado.sesion?.rol ?? null;
export const selectAccessToken = (estado: SesionState) =>
  estado.tokens?.accessToken ?? null;
export const selectHasHydrated = (estado: SesionState) => estado.hasHydrated;
