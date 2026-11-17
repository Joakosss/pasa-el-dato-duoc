import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { type BannerPublicidadActivo } from '@/lib/api/publicidad';
import { resolverUrlImagen } from '@/lib/api/publicaciones';
import { colors, spacing } from '@/theme';

type Props = {
  banner: BannerPublicidadActivo;
};

export function BannerPublicidad({ banner }: Props) {
  return (
    <View accessibilityLabel={`Contenido patrocinado de ${banner.marcaNombre}`} style={styles.tarjeta}>
      <View style={styles.etiqueta}>
        <MaterialCommunityIcons name="star-four-points-outline" size={13} color={colors.muted} />
        <Text style={styles.etiquetaTexto}>Patrocinado</Text>
      </View>

      <Image
        accessibilityLabel={`Banner de ${banner.marcaNombre}`}
        resizeMode="cover"
        source={{ uri: resolverUrlImagen(banner.imagenUrl) }}
        style={styles.imagen}
      />

      <View style={styles.contenido}>
        <Text style={styles.marca} numberOfLines={1}>
          {banner.marcaNombre}
        </Text>
        <Text style={styles.mensaje} numberOfLines={2}>
          {banner.mensaje}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    marginTop: spacing.padMd,
    overflow: 'hidden',
  },
  etiqueta: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: spacing.padSm,
    paddingVertical: 6,
  },
  etiquetaTexto: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  imagen: { backgroundColor: colors.surface, height: 132, width: '100%' },
  contenido: { gap: 3, padding: spacing.padSm },
  marca: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  mensaje: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
