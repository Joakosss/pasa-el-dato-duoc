import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { resolverUrlImagen } from '@/lib/api/publicaciones';
import { colors, spacing } from '@/theme';

interface ImagenGaleria {
  idImagen: string;
  url: string;
  orden: number;
}

export function GaleriaProducto({ imagenes }: { imagenes: ImagenGaleria[] }) {
  const imagenesOrdenadas = useMemo(
    () => [...imagenes].sort((primera, segunda) => primera.orden - segunda.orden),
    [imagenes],
  );
  const [imagenActivaId, setImagenActivaId] = useState<string | undefined>(
    imagenesOrdenadas[0]?.idImagen,
  );
  const imagenActiva =
    imagenesOrdenadas.find((imagen) => imagen.idImagen === imagenActivaId) ??
    imagenesOrdenadas[0];

  return (
    <View style={styles.galeria}>
      <View style={styles.portada}>
        {imagenActiva ? (
          <Image source={{ uri: resolverUrlImagen(imagenActiva.url) }} style={styles.imagenPortada} />
        ) : (
          <MaterialCommunityIcons name="image-outline" size={40} color={colors.card} />
        )}
      </View>

      {imagenesOrdenadas.length > 1 ? (
        <View style={styles.miniaturas}>
          {imagenesOrdenadas.map((imagen) => (
            <Pressable
              key={imagen.idImagen}
              accessibilityRole="button"
              accessibilityLabel="Ver imagen de la publicación"
              onPress={() => setImagenActivaId(imagen.idImagen)}
              style={[
                styles.miniatura,
                imagen.idImagen === imagenActiva?.idImagen ? styles.miniaturaActiva : null,
              ]}>
              <Image source={{ uri: resolverUrlImagen(imagen.url) }} style={styles.imagenMiniatura} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  galeria: { gap: spacing.padSm },
  portada: {
    alignItems: 'center',
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    height: 260,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagenPortada: { height: '100%', width: '100%' },
  miniaturas: { flexDirection: 'row', gap: 8 },
  miniatura: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
    borderWidth: 2,
    flex: 1,
    height: 64,
    overflow: 'hidden',
  },
  imagenMiniatura: { height: '100%', width: '100%' },
  miniaturaActiva: { borderColor: colors.gold },
});
