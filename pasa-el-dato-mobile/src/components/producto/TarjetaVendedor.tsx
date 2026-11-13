import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';

// Espejo del SellerCard web: encabezado "Vendedor", avatar, nombre, sede y la
// calificación a la derecha. El placeholder no trae calificaciones, así que se
// indica explícitamente en vez de mostrar un valor inventado.
export function TarjetaVendedor({
  nombre,
  sede,
}: {
  nombre: string;
  sede: string;
}) {
  return (
    <View style={styles.tarjeta}>
      <Text style={styles.titulo}>Vendedor</Text>

      <View style={styles.fila}>
        <Avatar nombre={nombre} tamano={44} />

        <View style={styles.datos}>
          <Text style={styles.nombre} numberOfLines={1}>
            {nombre}
          </Text>
          <Text style={styles.sede} numberOfLines={1}>
            Sede {sede}
          </Text>
        </View>

        <Text style={styles.calificacion} numberOfLines={1}>
          Sin calificaciones
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: spacing.padMd,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
  },
  titulo: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.padSm,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.padSm,
  },
  datos: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nombre: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  sede: {
    color: colors.muted,
    fontSize: 12,
  },
  calificacion: {
    flexShrink: 0,
    color: colors.muted,
    fontSize: 12,
  },
});
