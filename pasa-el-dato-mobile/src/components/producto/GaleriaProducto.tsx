import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

// Espejo del ProductGallery web: portada grande y cuatro miniaturas, con la
// primera marcada en dorado. Sin imágenes reales todavía: la portada y las
// miniaturas son placeholders gráficos, igual que en el diseño web.
const MINIATURAS = [0, 1, 2, 3];

export function GaleriaProducto() {
  return (
    <View style={styles.galeria}>
      <View style={styles.portada}>
        <MaterialCommunityIcons
          name="image-outline"
          size={40}
          color={colors.card}
        />
      </View>

      <View style={styles.miniaturas}>
        {MINIATURAS.map((indice) => (
          <View
            key={indice}
            style={[
              styles.miniatura,
              indice === 0 ? styles.miniaturaActiva : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  galeria: {
    gap: spacing.padSm,
  },
  portada: {
    height: 260,
    borderRadius: spacing.radiusLg,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniaturas: {
    flexDirection: 'row',
    gap: 8,
  },
  miniatura: {
    flex: 1,
    height: 64,
    borderRadius: spacing.radiusSm,
    borderColor: colors.border,
    borderWidth: 2,
    backgroundColor: colors.border,
  },
  miniaturaActiva: {
    borderColor: colors.gold,
  },
});
