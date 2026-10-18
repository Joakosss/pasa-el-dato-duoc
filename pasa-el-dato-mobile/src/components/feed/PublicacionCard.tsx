import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import type { PublicacionFeed } from '@/lib/feed/publicaciones-placeholder';

// Espejo del ProductCard web: imagen, etiqueta de categoría, título, precio y
// vendedor. Sin imágenes reales todavía, la portada es un placeholder gráfico.
// Toda la tarjeta abre el detalle de la publicación.
export function PublicacionCard({
  publicacion,
}: {
  publicacion: PublicacionFeed;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${publicacion.titulo}`}
      onPress={() =>
        router.push({
          pathname: '/producto/[id]',
          params: { id: publicacion.id },
        })
      }
      style={({ pressed }) => [
        styles.card,
        publicacion.patrocinada ? styles.cardPatrocinada : null,
        pressed && styles.pressed,
      ]}>
      <View style={styles.portada}>
        <MaterialCommunityIcons name="image-outline" size={26} color={colors.card} />

        <View style={styles.etiquetaCategoria}>
          <Text style={styles.etiquetaCategoriaTexto} numberOfLines={1}>
            {publicacion.categoria}
          </Text>
        </View>

        {publicacion.patrocinada ? (
          <View style={styles.etiquetaPatrocinada}>
            <Text style={styles.etiquetaPatrocinadaTexto}>Patrocinado</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>
          {publicacion.titulo}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {publicacion.detalle}
        </Text>

        <View style={styles.pie}>
          <Text style={styles.precio}>{publicacion.precio}</Text>
          <View style={styles.vendedor}>
            <Avatar nombre={publicacion.vendedor} tamano={18} />
            <Text style={styles.vendedorNombre} numberOfLines={1}>
              {publicacion.vendedor}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    overflow: 'hidden',
  },
  cardPatrocinada: {
    borderColor: colors.gold,
  },
  portada: {
    height: 112,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiquetaCategoria: {
    position: 'absolute',
    left: 8,
    top: 8,
    maxWidth: '72%',
    backgroundColor: colors.navy,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  etiquetaCategoriaTexto: {
    color: colors.card,
    fontSize: 10,
    fontWeight: '600',
  },
  etiquetaPatrocinada: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  etiquetaPatrocinadaTexto: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '800',
  },
  cuerpo: {
    padding: 10,
    gap: 3,
  },
  titulo: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
    minHeight: 34,
  },
  detalle: {
    color: colors.muted,
    fontSize: 11,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  precio: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '800',
  },
  vendedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  vendedorNombre: {
    color: colors.muted,
    fontSize: 10,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.9,
  },
});
