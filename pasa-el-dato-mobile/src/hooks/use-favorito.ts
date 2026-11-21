import { useCallback, useEffect } from 'react';

import { useAviso } from '@/components/ui/AvisoProvider';
import { ApiError } from '@/lib/api';
import { useFavoritosStore } from '@/stores/favoritos-store';
import { selectSesion, useSesionStore } from '@/stores/sesion-store';

export function useFavorito(publicacionId: string | undefined, accessToken: string | null) {
  const mostrarAviso = useAviso();
  const sesion = useSesionStore(selectSesion);
  const entrada = useFavoritosStore((estado) => publicacionId ? estado.entradas[publicacionId] : undefined);
  const cargar = useFavoritosStore((estado) => estado.cargar);
  const alternarCompartido = useFavoritosStore((estado) => estado.alternar);

  useEffect(() => {
    if (publicacionId && accessToken && sesion) {
      void cargar(publicacionId, accessToken, sesion);
    }
  }, [accessToken, cargar, publicacionId, sesion]);

  const reintentar = useCallback(() => {
    if (publicacionId && accessToken && sesion) {
      void cargar(publicacionId, accessToken, sesion);
    }
  }, [accessToken, cargar, publicacionId, sesion]);

  const alternar = useCallback(async () => {
    if (!publicacionId || !accessToken || !sesion) return;

    try {
      await alternarCompartido(publicacionId, accessToken, sesion);
    } catch (error: unknown) {
      const mensaje =
        error instanceof ApiError && error.status === 400 &&
        error.message === 'No puede guardar su propia publicación'
          ? 'No puedes agregar tu propia publicación a favoritos.'
          : error instanceof ApiError && error.status === 401
            ? 'Tu sesión no está disponible. Inicia sesión nuevamente.'
            : 'No pudimos actualizar tus favoritos. Inténtalo nuevamente.';
      mostrarAviso('Favoritos', mensaje);
    }
  }, [accessToken, alternarCompartido, mostrarAviso, publicacionId, sesion]);

  return {
    esFavorito: Boolean(sesion && accessToken && entrada?.esFavorito),
    cargando: Boolean(publicacionId && accessToken && sesion && (!entrada || entrada.cargando)),
    actualizando: Boolean(sesion && accessToken && entrada?.actualizando),
    errorCarga: Boolean(sesion && accessToken && entrada?.errorCarga),
    reintentar,
    alternar,
  };
}
