import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { LogoPD } from '@/components/auth/LogoPD';

// Portada del grupo (tabs): logo + acceso a login + bienvenida.
// Tiene menú inferior; AUTH queda fuera y no lo muestra.
export default function InicioScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <LogoPD />
        <Text style={styles.title}>Pasa el Dato</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/auth/login')}
          style={({ pressed }) => [styles.btn, styles.gold, pressed && styles.pressed]}>
          <Text style={styles.goldText}>Ir al login</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido</Text>
          <Text style={styles.cardText}>
            Explora publicaciones, vende lo que ya no usas y conversa con tu comunidad.
          </Text>
        </View>

        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/buscar')}
            style={({ pressed }) => [styles.btn, styles.gold, pressed && styles.pressed]}>
            <Text style={styles.goldText}>Buscar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/publicar')}
            style={({ pressed }) => [styles.btn, styles.sec, pressed && styles.pressed]}>
            <Text style={styles.secText}>Publicar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    padding: spacing.padLg,
    gap: 12,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    padding: spacing.padLg,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  cardText: {
    fontSize: 14,
    color: colors.navy,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gold: {
    backgroundColor: colors.gold,
  },
  sec: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  goldText: {
    color: colors.navy,
    fontWeight: '700',
    fontSize: 16,
  },
  secText: {
    color: colors.navy,
    fontWeight: '600',
    fontSize: 16,
  },
});
