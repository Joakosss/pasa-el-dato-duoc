import { Redirect, Stack, usePathname } from 'expo-router';

import { resolverDestinoPorRol } from '@/lib/auth/destino-por-rol';
import {
  selectEstaAutenticado,
  selectHasHydrated,
  selectRol,
  useSesionStore,
} from '@/stores/sesion-store';

// Grupo /auth: login + register. Solo gráfico, sin header nativo.
export default function AuthLayout() {
  const pathname = usePathname();
  const hasHydrated = useSesionStore(selectHasHydrated);
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  const rol = useSesionStore(selectRol);

  // Guarda inversa: quien ya inició sesión no vuelve al login, se le manda a la
  // ruta de su rol. Registro sigue accesible (solo se protege el login).
  if (hasHydrated && estaAutenticado && rol && pathname === '/auth/login') {
    return <Redirect href={resolverDestinoPorRol(rol)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
