import { Stack } from 'expo-router';

// Grupo /auth: login + register. Solo gráfico, sin header nativo.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
