import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { LogoPD } from '@/components/auth/LogoPD';

// Espejo gráfico de front/app/(auth)/login/page.tsx. Sin submit real.
export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [foco, setFoco] = useState<'correo' | 'clave' | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <LogoPD />
        <Text style={styles.title}>Iniciar sesión</Text>
        <Text style={styles.subtitle}>Bienvenido de vuelta a Pasa el Dato Duoc</Text>

        <Text style={styles.label}>Correo institucional</Text>
        <TextInput
          value={correo}
          onChangeText={setCorreo}
          placeholder="ejemplo@correo.duoc.cl"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFoco('correo')}
          onBlur={() => setFoco(null)}
          style={[styles.input, foco === 'correo' && styles.inputFocus]}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          value={clave}
          onChangeText={setClave}
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          secureTextEntry
          onFocus={() => setFoco('clave')}
          onBlur={() => setFoco(null)}
          style={[styles.input, foco === 'clave' && styles.inputFocus]}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('Solo gráfico', 'Login sin conexión al back.')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </Pressable>

        <View style={styles.row}>
          <Text style={styles.muted}>¿No tienes cuenta? </Text>
          <Link href="/auth/register" style={styles.link}>
            Regístrate aquí
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.padSm,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    padding: spacing.padLg,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    color: colors.navy,
  },
  inputFocus: {
    borderColor: colors.gold,
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: colors.navy,
    fontWeight: '700',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
  },
  link: {
    color: colors.navy,
    fontWeight: '700',
    fontSize: 14,
  },
});
