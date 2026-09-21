import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onAceptar: () => void;
}

// Modal estático. Sin TermsContent completo web.
export function TermsModal({ abierto, onCerrar, onAceptar }: Props) {
  return (
    <Modal visible={abierto} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <View style={styles.caja}>
          <Text style={styles.titulo}>Términos y Condiciones</Text>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.texto}>
              Piloto gráfico. Aquí irá el resumen de términos. De momento solo valida apertura,
              cierre y aceptación visual.
            </Text>
          </ScrollView>
          <View style={styles.pie}>
            <Pressable accessibilityRole="button" onPress={onCerrar} style={[styles.btn, styles.sec]}>
              <Text style={styles.secText}>Cerrar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onAceptar} style={[styles.btn, styles.pri]}>
              <Text style={styles.priText}>Acepto</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,43,73,0.6)',
    padding: spacing.padLg,
    justifyContent: 'center',
  },
  caja: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  titulo: {
    paddingHorizontal: spacing.padLg,
    paddingVertical: spacing.padMd,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { padding: spacing.padLg },
  texto: { color: colors.navy, fontSize: 14 },
  pie: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: spacing.padLg,
    paddingVertical: spacing.padMd,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: {
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sec: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  pri: { backgroundColor: colors.gold },
  secText: { color: colors.navy, fontWeight: '600' },
  priText: { color: colors.navy, fontWeight: '700' },
});
