import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolverUrlImagen, type PublicacionPublica } from '@/lib/api/publicaciones';
import type { PublicacionFeed } from '@/lib/feed/publicaciones-placeholder';
import { useFavoritosMomentaneoStore } from '@/stores/favoritos-momentaneo-store';
import { colors, spacing } from '@/theme';

function esPublicacionReal(
  publicacion: PublicacionPublica | PublicacionFeed,
): publicacion is PublicacionPublica {
  return 'imagenes' in publicacion && 'tipoVenta' in publicacion;
}

export function PublicacionCard({
  publicacion,
}: {
  publicacion: PublicacionPublica | PublicacionFeed;
}) {
  const publicacionReal = esPublicacionReal(publicacion);
  const portada = publicacionReal
    ? publicacion.imagenes
        .slice()
        .sort((primera, segunda) => primera.orden - segunda.orden)[0]
    : undefined;
  const categoria = publicacionReal ? publicacion.categoria.nombre : publicacion.categoria;
  const detalle = publicacionReal
    ? `${publicacion.tipoVenta.nombre} · ${publicacion.sede.nombre}`
    : publicacion.detalle;
  const precio = publicacionReal
    ? `$${new Intl.NumberFormat('es-CL').format(publicacion.precio)}`
    : publicacion.precio;
  const esFavoritoMomentaneo = useFavoritosMomentaneoStore((estado) =>
    estado.esFavoritoMomentaneo(publicacion.id),
  );
  const alternarFavoritoMomentaneo = useFavoritosMomentaneoStore(
    (estado) => estado.alternarFavoritoMomentaneo,
  );

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
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.portada}>
        {portada ? (
          <Image source={{ uri: resolverUrlImagen(portada.url) }} style={styles.imagen} />
        ) : (
          <MaterialCommunityIcons name="image-outline" size={26} color={colors.card} />
        )}

        <View style={styles.etiquetaCategoria}>
          <Text style={styles.etiquetaCategoriaTexto} numberOfLines={1}>
            {categoria}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            esFavoritoMomentaneo ? 'Quitar de favoritos' : 'Agregar a favoritos'
          }
          accessibilityState={{ selected: esFavoritoMomentaneo }}
          hitSlop={8}
          onPress={(evento) => {
            evento.stopPropagation();
            alternarFavoritoMomentaneo(publicacion.id);
          }}
          style={styles.botonFavorito}>
          <MaterialCommunityIcons
            name={esFavoritoMomentaneo ? 'heart' : 'heart-outline'}
            size={19}
            color={esFavoritoMomentaneo ? colors.error : colors.navy}
          />
        </Pressable>
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={2}>
          {publicacion.titulo}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {detalle}
        </Text>
        <Text style={styles.precio}>
          {precio}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  portada: {
    alignItems: 'center',
    backgroundColor: colors.border,
    height: 112,
    justifyContent: 'center',
  },
  imagen: { height: '100%', width: '100%' },
  etiquetaCategoria: {
    backgroundColor: colors.navy,
    borderRadius: 6,
    left: 8,
    maxWidth: '72%',
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: 8,
  },
  etiquetaCategoriaTexto: { color: colors.card, fontSize: 10, fontWeight: '600' },
  botonFavorito: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
  },
  cuerpo: { gap: 3, padding: 10 },
  titulo: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
    minHeight: 34,
  },
  detalle: { color: colors.muted, fontSize: 11 },
  precio: { color: colors.navy, fontSize: 15, fontWeight: '800', marginTop: 4 },
  pressed: { opacity: 0.9 },
});
