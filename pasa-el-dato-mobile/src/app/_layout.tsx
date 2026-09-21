import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

// Raíz: index redirige a /inicio (tabs). AUTH fuera de tabs, sin menú.
export default function RootLayout() {
  return (
    <>
      <AnimatedSplashOverlay />
      {/* Solo Android: botones oscuros sobre fondos claros (app siempre clara). */}
      <NavigationBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
