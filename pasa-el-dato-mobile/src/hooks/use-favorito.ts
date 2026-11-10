import { useCallback, useEffect, useState } from 'react';

import {
  marcarFavorito,
  obtenerEstadoFavorito,
  quitarFavorito,
} from '@/lib/api/favoritos';

export function useFavorito(publicacionId: string | undefined, accessToken: string | null) {
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargando, setCargando] = useState(Boolean(publicacionId && accessToken));
  const [actualizando, setActualizando] = useState(false);

  const cargar = useCallback(async () => {
    if (!publicacionId || !accessToken) {
      setEsFavorito(false);
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      const respuesta = await obtenerEstadoFavorito(publicacionId, accessToken);
      setEsFavorito(respuesta.esFavorito);
    } finally {
      setCargando(false);
    }
  }, [accessToken, publicacionId]);

  useEffect(() => {
    void cargar().catch(() => undefined);
  }, [cargar]);

  const alternar = useCallback(async () => {
    if (!publicacionId || !accessToken || actualizando) return;

    setActualizando(true);
    try {
      if (esFavorito) {
        await quitarFavorito(publicacionId, accessToken);
        setEsFavorito(false);
      } else {
        const respuesta = await marcarFavorito(publicacionId, accessToken);
        setEsFavorito(respuesta.esFavorito);
      }
    } finally {
      setActualizando(false);
    }
  }, [accessToken, actualizando, esFavorito, publicacionId]);

  return {
    esFavorito,
    cargando,
    actualizando,
    alternar,
  };
}
