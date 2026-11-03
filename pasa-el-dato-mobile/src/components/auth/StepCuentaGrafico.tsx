import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface Props {
  run: string;
  correo: string;
  errorRun?: string;
  errorCorreo?: string;
  deshabilitado?: boolean;
  onRunChange: (valor: string) => void;
  onRunBlur?: () => void;
  onCorreoChange: (valor: string) => void;
}

export function StepCuentaGrafico({
  run,
  correo,
  errorRun,
  errorCorreo,
  deshabilitado = false,
  onRunChange,
  onRunBlur,
  onCorreoChange,
}: Props) {
  return (
    <View style={styles.col}>
      <Text style={styles.label}>RUT</Text>
      <TextInput
        value={run}
        onChangeText={onRunChange}
        onBlur={onRunBlur}
        placeholder="12345678-5"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!deshabilitado}
        maxLength={10}
        style={[styles.input, errorRun ? styles.inputError : null]}
      />
      {errorRun ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorRun}
        </Text>
      ) : null}

      <Text style={styles.label}>Correo institucional</Text>
      <TextInput
        value={correo}
        onChangeText={onCorreoChange}
        placeholder="ejemplo@duocuc.cl"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        editable={!deshabilitado}
        style={[styles.input, errorCorreo ? styles.inputError : null]}
      />
      {errorCorreo ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorCorreo}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: colors.navy },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    color: colors.navy,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: -4,
  },
});
