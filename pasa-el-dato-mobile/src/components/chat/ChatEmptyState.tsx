import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

// Espejo del ChatEmptyState web. Se muestra cuando la pestaña activa no tiene
// conversaciones (hoy el placeholder siempre trae chats en ambas pestañas).
export function ChatEmptyState() {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.icono}>
        <MaterialCommunityIcons name="chat-outline" size={26} color={colors.gold} />
      </View>

      <Text style={styles.titulo}>Sin chats activos</Text>
      <Text style={styles.mensaje}>
        Aún no tienes conversaciones. Explora publicaciones y vuelve aquí.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio"
        onPress={() => router.push('/inicio')}
        style={({ pressed }) => [styles.boton, pressed && styles.pressed]}>
        <Text style={styles.botonTexto}>Volver al inicio</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    alignItems: 'center',
    padding: spacing.padLg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
  },
  icono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.padSm,
  },
  titulo: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  mensaje: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  boton: {
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    marginTop: spacing.padLg,
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
