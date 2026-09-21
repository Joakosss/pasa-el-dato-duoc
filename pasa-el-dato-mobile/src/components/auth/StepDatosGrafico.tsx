import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/theme';

export interface DatosGrafico {
  pNombre: string;
  sNombre: string;
  pApellido: string;
  sApellido: string;
  telefono: string;
}

interface Props {
  datos: DatosGrafico;
  onChange: (parcial: Partial<DatosGrafico>) => void;
}

// Espejo gráfico de StepDatos web. Sin validación.
export function StepDatosGrafico({ datos, onChange }: Props) {
  return (
    <View style={styles.col}>
      <Text style={styles.label}>Primer nombre *</Text>
      <TextInput value={datos.pNombre} onChangeText={(v) => onChange({ pNombre: v })} placeholder="Camila" placeholderTextColor={colors.muted} style={styles.input} />
      <Text style={styles.label}>Segundo nombre</Text>
      <TextInput value={datos.sNombre} onChangeText={(v) => onChange({ sNombre: v })} placeholder="Andrea (opcional)" placeholderTextColor={colors.muted} style={styles.input} />
      <Text style={styles.label}>Apellido paterno *</Text>
      <TextInput value={datos.pApellido} onChangeText={(v) => onChange({ pApellido: v })} placeholder="Rojas" placeholderTextColor={colors.muted} style={styles.input} />
      <Text style={styles.label}>Apellido materno *</Text>
      <TextInput value={datos.sApellido} onChangeText={(v) => onChange({ sApellido: v })} placeholder="Paredes" placeholderTextColor={colors.muted} style={styles.input} />
      <Text style={styles.label}>Teléfono *</Text>
      <TextInput value={datos.telefono} onChangeText={(v) => onChange({ telefono: v })} placeholder="+569 1234 5678" placeholderTextColor={colors.muted} keyboardType="phone-pad" style={styles.input} />
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
