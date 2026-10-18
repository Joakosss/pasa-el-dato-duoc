import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { LogoPD } from '@/components/auth/LogoPD';
import { ApiError } from '@/lib/api';
import { iniciarSesion } from '@/lib/api/auth';
import { resolverDestinoPorRol } from '@/lib/auth/destino-por-rol';
import { validarCorreoDuoc } from '@/lib/validators/correo';
import { useSesionStore } from '@/stores/sesion-store';

// Login real contra POST /auth/login. Valida el correo institucional en el
// dispositivo, guarda sesión y tokens en el store y redirige según el rol.
export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [foco, setFoco] = useState<'correo' | 'clave' | null>(null);
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const [errorClave, setErrorClave] = useState<string | undefined>();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async () => {
    if (cargando) return;

    const validacion = validarCorreoDuoc(correo);
    if (!validacion.ok) {
      setErrorCorreo(validacion.error);
      setErrorClave(undefined);
      setErrorGeneral(null);
      return;
    }
    if (!clave.trim()) {
      setErrorCorreo(undefined);
      setErrorClave('Ingresa tu contraseña.');
      setErrorGeneral(null);
      return;
    }

    setErrorCorreo(undefined);
    setErrorClave(undefined);
    setErrorGeneral(null);
    setCargando(true);

    try {
      const dto = await iniciarSesion({
        correo: validacion.normalizado ?? correo.trim().toLowerCase(),
        contrasena: clave,
      });
      useSesionStore.getState().iniciarSesion(dto);
      router.replace(resolverDestinoPorRol(dto.usuario.rol));
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        // Mensaje genérico: no revelamos si falló el correo o la contraseña.
        setErrorGeneral('Correo o contraseña incorrectos.');
      } else if (error instanceof ApiError && error.status === 403) {
        // El back informa la causa real (bloqueada/inactiva).
        setErrorGeneral(error.message || 'Cuenta bloqueada o inactiva.');
      } else if (error instanceof ApiError && error.status === 400) {
        setErrorGeneral(error.message || 'Revisa los datos ingresados.');
      } else {
        setErrorGeneral('No pudimos iniciar sesión. Reintenta.');
      }
      setCargando(false);
      return;
    }

    // Se mantiene "cargando" hasta que la redirección reemplaza la pantalla.
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
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
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!cargando}
              onFocus={() => setFoco('correo')}
              onBlur={() => setFoco(null)}
              style={[
                styles.input,
                foco === 'correo' && styles.inputFocus,
                errorCorreo ? styles.inputError : null,
              ]}
            />
            {errorCorreo ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {errorCorreo}
              </Text>
            ) : null}

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              value={clave}
              onChangeText={setClave}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              editable={!cargando}
              returnKeyType="go"
              onSubmitEditing={enviar}
              onFocus={() => setFoco('clave')}
              onBlur={() => setFoco(null)}
              style={[
                styles.input,
                foco === 'clave' && styles.inputFocus,
                errorClave ? styles.inputError : null,
              ]}
            />
            {errorClave ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {errorClave}
              </Text>
            ) : null}

            {errorGeneral ? (
              <View style={styles.errorBox}>
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {errorGeneral}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: cargando, busy: cargando }}
              disabled={cargando}
              onPress={enviar}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
                cargando && styles.buttonDisabled,
              ]}>
              {cargando ? (
                <View style={styles.buttonRow}>
                  <ActivityIndicator color={colors.navy} size="small" />
                  <Text style={styles.buttonText}>Iniciando sesión…</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </Pressable>

            <View style={styles.row}>
              <Text style={styles.muted}>¿No tienes cuenta? </Text>
              <Link href="/auth/register" style={styles.link}>
                Regístrate aquí
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.padSm,
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
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    color: colors.error,
    fontSize: 13,
    marginTop: -4,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
