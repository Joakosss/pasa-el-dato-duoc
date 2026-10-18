import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { selectSesion, useSesionStore } from '@/stores/sesion-store';

// Perfil: muestra la sesión vigente y permite cerrarla.
export default function PerfilScreen() {
  const sesion = useSesionStore(selectSesion);

  const cerrarSesion = () => {
    // Vacía el store y elimina la entrada de SecureStore (tokens incluidos).
    useSesionStore.getState().cerrarSesion();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={28} color={colors.gold} />
        </View>
        <Text style={styles.title}>{sesion?.nombreCompleto ?? 'Sesión no iniciada'}</Text>
        <Text style={styles.subtitle}>{sesion?.correo ?? 'Vuelve a iniciar sesión'}</Text>

        {sesion ? (
          <View style={styles.rolBox}>
            <Text style={styles.rolLabel}>Rol</Text>
            <Text style={styles.rolValor}>{sesion.rol.descripcion}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={cerrarSesion}
          style={({ pressed }) => [styles.boton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
          <Text style={styles.botonTexto}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.padLg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    padding: spacing.padLg,
    gap: 8,
  },
  avatar: {
    width: spacing.logoSize,
    height: spacing.logoSize,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  rolBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
    marginTop: 8,
  },
  rolLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  rolValor: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.9,
  },
  botonTexto: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 16,
  },
});
