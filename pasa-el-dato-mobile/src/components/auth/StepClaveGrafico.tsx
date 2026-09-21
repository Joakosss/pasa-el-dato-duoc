import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface Props {
  run: string;
  correo: string;
  nombreResumen: string;
  clave: string;
  confirmacion: string;
  aceptaTerminos: boolean;
  onClaveChange: (v: string) => void;
  onConfirmacionChange: (v: string) => void;
  onAbrirTerminos: () => void;
}

// Espejo gráfico de StepClave web. Modal se inyecta desde register (T8).
export function StepClaveGrafico({
  run,
  correo,
  nombreResumen,
  clave,
  confirmacion,
  aceptaTerminos,
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
      <TextInput value={clave} onChangeText={onClaveChange} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} />
      <Text style={styles.label}>Confirmar contraseña</Text>
      <TextInput value={confirmacion} onChangeText={onConfirmacionChange} placeholder="Repite tu contraseña" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} />

      <Pressable accessibilityRole="checkbox" onPress={onAbrirTerminos} style={styles.checkRow}>
        <View style={[styles.check, aceptaTerminos && styles.checkOn]}>
          {aceptaTerminos ? <Text style={styles.checkText}>✓</Text> : null}
        </View>
        <Text style={styles.checkLabel}>
          Acepto los <Text style={styles.link}>términos y condiciones</Text>
        </Text>
      </Pressable>
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
  checkText: { color: colors.gold, fontWeight: '800' },
  checkLabel: { color: colors.navy, fontSize: 14 },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
});
