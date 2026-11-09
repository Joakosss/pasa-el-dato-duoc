import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ApiError } from '@/lib/api';
import { consultarSesion, renovarSesion } from '@/lib/api/auth';
import {
  selectHasHydrated,
  selectSesion,
  useSesionStore,
} from '@/stores/sesion-store';

SplashScreen.preventAutoHideAsync();

// Raíz: index redirige a /inicio (tabs). AUTH fuera de tabs, sin menú.
// PRODUCTO también queda fuera de tabs: el detalle no muestra menú inferior.
export default function RootLayout() {
  const hasHydrated = useSesionStore(selectHasHydrated);
  const sesion = useSesionStore(selectSesion);

  useEffect(() => {
    if (!hasHydrated || !sesion) return;

    let cancelado = false;

    const validarSesion = async () => {
      const estado = useSesionStore.getState();
      const tokens = estado.tokens;
      if (!tokens) {
        estado.cerrarSesion();
        return;
      }

      try {
        await consultarSesion(tokens.accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) return;

        try {
          const renovada = await renovarSesion(tokens.refreshToken);
          if (cancelado) return;

          useSesionStore.getState().renovarTokens(renovada);
          await consultarSesion(renovada.accessToken);
        } catch {
          if (!cancelado) {
            useSesionStore.getState().cerrarSesion();
          }
        }
      }
    };

    void validarSesion();

    return () => {
      cancelado = true;
    };
  }, [hasHydrated, sesion]);

  return (
    <>
      <AnimatedSplashOverlay />
      {/* Solo Android: botones oscuros sobre fondos claros (app siempre clara). */}
      <NavigationBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="producto/[id]" />
      </Stack>
    </>
  );
}
