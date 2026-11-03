import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface Props {
  visible: boolean;
  onIniciarSesion: () => void;
}

export function RegistroExitosoModal({ visible, onIniciarSesion }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onIniciarSesion}>
      <View style={styles.overlay}>
        <View style={styles.caja}>
          <View accessibilityLabel="Registro exitoso" style={styles.icono}>
            <Text style={styles.check}>✓</Text>
          </View>
          <Text style={styles.titulo}>¡Cuenta creada con éxito!</Text>
          <Text style={styles.subtitulo}>
            Tu cuenta ha sido registrada correctamente en Pasa el Dato.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onIniciarSesion}
            style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}>
            <Text style={styles.botonTexto}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,43,73,0.6)',
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  caja: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padMd,
    maxWidth: 420,
    padding: spacing.padLg,
    width: '100%',
  },
  icono: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: colors.navy,
    borderRadius: 40,
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  check: {
    color: colors.navy,
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 48,
  },
  titulo: {
    color: colors.navy,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitulo: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  boton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    marginTop: spacing.padSm,
    minHeight: spacing.touchMin,
  },
  botonPresionado: { opacity: 0.9 },
  botonTexto: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
});
