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
  errorTelefono?: string;
  onChange: (parcial: Partial<DatosGrafico>) => void;
}

export function StepDatosGrafico({ datos, errorTelefono, onChange }: Props) {
  return (
    <View style={styles.col}>
      <Text style={styles.label}>Primer nombre *</Text>
      <TextInput
        value={datos.pNombre}
        onChangeText={(valor) => onChange({ pNombre: valor })}
        placeholder="Camila"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={styles.label}>Segundo nombre</Text>
      <TextInput
        value={datos.sNombre}
        onChangeText={(valor) => onChange({ sNombre: valor })}
        placeholder="Andrea (opcional)"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={styles.label}>Apellido paterno *</Text>
      <TextInput
        value={datos.pApellido}
        onChangeText={(valor) => onChange({ pApellido: valor })}
        placeholder="Rojas"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={styles.label}>Apellido materno *</Text>
      <TextInput
        value={datos.sApellido}
        onChangeText={(valor) => onChange({ sApellido: valor })}
        placeholder="Paredes"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={styles.label}>Teléfono *</Text>
      <TextInput
        value={datos.telefono}
        onChangeText={(valor) => onChange({ telefono: valor })}
        placeholder="+56 9 3651 7901"
        placeholderTextColor={colors.muted}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        style={[styles.input, errorTelefono ? styles.inputError : null]}
      />
      {errorTelefono ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorTelefono}
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
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 13, marginTop: -4 },
});
