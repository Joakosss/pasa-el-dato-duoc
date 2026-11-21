import { create } from 'zustand';

import { marcarFavorito, obtenerEstadoFavorito, quitarFavorito } from '@/lib/api/favoritos';
import { ApiError } from '@/lib/api/http-client';
import { useSesionStore, type Sesion } from '@/stores/sesion-store';

interface EntradaFavorito {
  esFavorito: boolean | null;
  cargando: boolean;
  actualizando: boolean;
  errorCarga: boolean;
}

interface FavoritosState {
  entradas: Record<string, EntradaFavorito>;
  cargar: (id: string, token: string, sesion: Sesion) => Promise<void>;
  alternar: (id: string, token: string, sesion: Sesion) => Promise<void>;
}

export const useFavoritosStore = create<FavoritosState>((set, get) => ({
  entradas: {},

  cargar: async (id, token, sesion) => {
    const existente = get().entradas[id];
    if (useSesionStore.getState().sesion !== sesion || (existente && !existente.errorCarga)) return;
    const pendiente: EntradaFavorito = { esFavorito: null, cargando: true, actualizando: false, errorCarga: false };
    set((estado) => ({ entradas: { ...estado.entradas, [id]: pendiente } }));

    try {
      const resultado = await obtenerEstadoFavorito(id, token);
      if (useSesionStore.getState().sesion === sesion && get().entradas[id] === pendiente) {
        set((estado) => ({
          entradas: { ...estado.entradas, [id]: { ...pendiente, esFavorito: resultado.esFavorito, cargando: false } },
        }));
      }
    } catch {
      if (useSesionStore.getState().sesion === sesion && get().entradas[id] === pendiente) {
        set((estado) => ({
          entradas: { ...estado.entradas, [id]: { ...pendiente, cargando: false, errorCarga: true } },
        }));
      }
    }
  },

  alternar: async (id, token, sesion) => {
    const entrada = get().entradas[id];
    if (useSesionStore.getState().sesion !== sesion || !entrada || entrada.esFavorito === null || entrada.cargando || entrada.actualizando) return;
    const pendiente = { ...entrada, actualizando: true };
    set((estado) => ({ entradas: { ...estado.entradas, [id]: pendiente } }));

    try {
      let esFavorito: boolean;
      if (entrada.esFavorito) {
        await quitarFavorito(id, token);
        esFavorito = false;
      } else {
        esFavorito = (await marcarFavorito(id, token)).esFavorito;
      }
      if (useSesionStore.getState().sesion === sesion && get().entradas[id] === pendiente) {
        set((estado) => ({
          entradas: { ...estado.entradas, [id]: { esFavorito, cargando: false, actualizando: false, errorCarga: false } },
        }));
      }
    } catch (error) {
      if (useSesionStore.getState().sesion === sesion && get().entradas[id] === pendiente) {
        const rechazoConfirmado = error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 408;
        set((estado) => ({
          entradas: {
            ...estado.entradas,
            [id]: rechazoConfirmado
              ? entrada
              : { esFavorito: null, cargando: false, actualizando: false, errorCarga: true },
          },
        }));
        throw error;
      }
    }
  },
}));

useSesionStore.subscribe((estado, anterior) => {
  if (estado.sesion !== anterior.sesion) useFavoritosStore.setState({ entradas: {} });
});
