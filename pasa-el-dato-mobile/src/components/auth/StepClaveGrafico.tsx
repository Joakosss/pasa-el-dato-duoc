import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface Props {
  run: string;
  correo: string;
  nombreResumen: string;
  clave: string;
  confirmacion: string;
  aceptaTerminos: boolean;
  errorClave?: string;
  errorConfirmacion?: string;
  errorTerminos?: string;
  errorRegistro?: string;
  deshabilitado?: boolean;
  onClaveChange: (valor: string) => void;
  onConfirmacionChange: (valor: string) => void;
  onAbrirTerminos: () => void;
}

export function StepClaveGrafico({
  run,
  correo,
  nombreResumen,
  clave,
  confirmacion,
  aceptaTerminos,
  errorClave,
  errorConfirmacion,
  errorTerminos,
  errorRegistro,
  deshabilitado = false,
  onClaveChange,
  onConfirmacionChange,
  onAbrirTerminos,
}: Props) {
  return (
    <View style={styles.col}>
      <View style={styles.resumen}>
        <View style={styles.fila}>
          <Text style={styles.dt}>RUT</Text>
          <Text style={styles.dd}>{run || '—'}</Text>
        </View>
        <View style={styles.fila}>
          <Text style={styles.dt}>Correo</Text>
          <Text style={styles.dd}>{correo || '—'}</Text>
        </View>
        <View style={styles.fila}>
          <Text style={styles.dt}>Nombre</Text>
          <Text style={styles.dd}>{nombreResumen || '—'}</Text>
        </View>
      </View>

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        value={clave}
        onChangeText={onClaveChange}
        placeholder="Mínimo 6 caracteres"
        placeholderTextColor={colors.muted}
        secureTextEntry
        editable={!deshabilitado}
        autoCapitalize="none"
        autoComplete="new-password"
        style={[styles.input, errorClave ? styles.inputError : null]}
      />
      {errorClave ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorClave}
        </Text>
      ) : null}

      <Text style={styles.label}>Confirmar contraseña</Text>
      <TextInput
        value={confirmacion}
        onChangeText={onConfirmacionChange}
        placeholder="Repite tu contraseña"
        placeholderTextColor={colors.muted}
        secureTextEntry
        editable={!deshabilitado}
        autoCapitalize="none"
        autoComplete="new-password"
        style={[styles.input, errorConfirmacion ? styles.inputError : null]}
      />
      {errorConfirmacion ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorConfirmacion}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceptaTerminos, disabled: deshabilitado }}
        disabled={deshabilitado}
        onPress={onAbrirTerminos}
        style={styles.checkRow}>
        <View style={[styles.check, aceptaTerminos && styles.checkOn, errorTerminos && styles.checkError]}>
          {aceptaTerminos ? <Text style={styles.checkText}>✓</Text> : null}
        </View>
        <Text style={styles.checkLabel}>
          Acepto los <Text style={styles.link}>términos y condiciones</Text>
        </Text>
      </Pressable>
      {errorTerminos ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorTerminos}
        </Text>
      ) : null}
      {errorRegistro ? (
        <Text accessibilityRole="alert" style={styles.errorRegistro}>
          {errorRegistro}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 10 },
  resumen: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusMd,
    padding: spacing.padMd,
    gap: 6,
  },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dt: { color: colors.muted, fontSize: 14 },
  dd: { color: colors.navy, fontWeight: '700', fontSize: 14 },
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
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 13, marginTop: -4 },
  errorRegistro: {
    backgroundColor: '#fef2f2',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    color: colors.error,
    fontSize: 14,
    padding: spacing.padMd,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkError: { borderColor: colors.error },
  checkText: { color: colors.gold, fontWeight: '800' },
  checkLabel: { color: colors.navy, fontSize: 14 },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
});
