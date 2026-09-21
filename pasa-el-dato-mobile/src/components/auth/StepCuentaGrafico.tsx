import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface Props {
  run: string;
  correo: string;
  onRunChange: (v: string) => void;
  onCorreoChange: (v: string) => void;
}

// Espejo gráfico de StepCuenta web. Sin debounce, sin validación back.
export function StepCuentaGrafico({ run, correo, onRunChange, onCorreoChange }: Props) {
  return (
    <View style={styles.col}>
      <Text style={styles.label}>RUT</Text>
      <TextInput
        value={run}
        onChangeText={onRunChange}
        placeholder="12.345.678-5"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={styles.input}
      />
      <Text style={styles.label}>Correo institucional</Text>
      <TextInput
        value={correo}
        onChangeText={onCorreoChange}
        placeholder="ejemplo@duocuc.cl"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
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
});
