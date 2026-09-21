import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

// Espejo gráfico de StepCarrera web. Selects como placeholders (decidido).
export function StepCarreraGrafico() {
  const avisar = () => Alert.alert('Solo gráfico', 'Selector sin datos reales.');
  return (
    <View style={styles.col}>
      <Text style={styles.label}>Sede *</Text>
      <Pressable accessibilityRole="button" onPress={avisar} style={styles.placeholder}>
        <Text style={styles.placeholderText}>Selecciona tu sede</Text>
      </Pressable>
      <Text style={styles.label}>Escuela *</Text>
      <Pressable accessibilityRole="button" onPress={avisar} style={styles.placeholder}>
        <Text style={styles.placeholderText}>Selecciona tu escuela</Text>
      </Pressable>
      <Text style={styles.label}>Carrera *</Text>
      <Pressable accessibilityRole="button" onPress={avisar} style={styles.placeholder}>
        <Text style={styles.placeholderText}>Primero elige escuela</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: colors.navy },
  placeholder: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    justifyContent: 'center',
  },
  placeholderText: { color: colors.muted, fontSize: 14 },
});
