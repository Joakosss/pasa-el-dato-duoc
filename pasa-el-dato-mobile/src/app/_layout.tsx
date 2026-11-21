import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AvisoProvider } from '@/components/ui/AvisoProvider';
import { consultarSesion } from '@/lib/api/auth';
import { crearSocketChat } from '@/lib/chat/chat-socket';
import {
  selectAccessToken,
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
  const accessToken = useSesionStore(selectAccessToken);

  useEffect(() => {
    if (!hasHydrated || !sesion) return;

    const tokens = useSesionStore.getState().tokens;
    if (!tokens) return;

    // El cliente coordina la renovación. Los fallos de red no cierran la sesión.
    void consultarSesion(tokens.accessToken).catch(() => undefined);
  }, [hasHydrated, sesion]);

  useEffect(() => {
    if (!hasHydrated || !accessToken) return;

    const socketPresencia = crearSocketChat(accessToken);
    void socketPresencia.conectar().catch(() => {
      // La presencia es opcional: no interrumpe navegación ni Chat REST.
    });

    return () => socketPresencia.desconectar();
  }, [accessToken, hasHydrated]);

  return (
    <AvisoProvider>
      <AnimatedSplashOverlay />
      {/* Solo Android: botones oscuros sobre fondos claros (app siempre clara). */}
      <NavigationBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="producto/[id]" />
      </Stack>
    </AvisoProvider>
  );
}
