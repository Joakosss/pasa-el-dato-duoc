import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { resolverUrlImagen } from '@/lib/api/publicaciones';
import { colors, spacing } from '@/theme';

interface ImagenGaleria {
  idImagen: string;
  url: string;
  orden: number;
}

interface ImagenVisor {
  id: string;
  uri: string;
}

export function GaleriaProducto({ imagenes }: { imagenes: ImagenGaleria[] }) {
  const { width: anchoPantalla } = useWindowDimensions();
  const listaRef = useRef<FlatList<ImagenVisor>>(null);
  const imagenesOrdenadas = useMemo(
    () => [...imagenes].sort((primera, segunda) => primera.orden - segunda.orden),
    [imagenes],
  );
  const imagenesVisor = useMemo(
    () =>
      imagenesOrdenadas.map((imagen) => ({
        id: imagen.idImagen,
        uri: resolverUrlImagen(imagen.url),
      })),
    [imagenesOrdenadas],
  );
  const [imagenActivaId, setImagenActivaId] = useState<string | undefined>(
    imagenesOrdenadas[0]?.idImagen,
  );
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [indiceVisor, setIndiceVisor] = useState(0);
  const imagenActiva =
    imagenesOrdenadas.find((imagen) => imagen.idImagen === imagenActivaId) ??
    imagenesOrdenadas[0];

  const abrirVisor = (idImagen: string) => {
    const indice = imagenesOrdenadas.findIndex((imagen) => imagen.idImagen === idImagen);
    if (indice < 0) return;

    setImagenActivaId(idImagen);
    setIndiceVisor(indice);
    setVisorAbierto(true);

    requestAnimationFrame(() => {
      listaRef.current?.scrollToIndex({ index: indice, animated: false });
    });
  };

  const cerrarVisor = () => setVisorAbierto(false);

  return (
    <View style={styles.galeria}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir imagen en pantalla completa"
        disabled={!imagenActiva}
        onPress={() => imagenActiva && abrirVisor(imagenActiva.idImagen)}
        style={styles.portada}>
        {imagenActiva ? (
          <>
            <Image
              source={{ uri: resolverUrlImagen(imagenActiva.url) }}
              style={styles.imagenPortada}
            />
            <View style={styles.indicadorAmpliar}>
              <MaterialCommunityIcons name="fullscreen" size={18} color={colors.card} />
            </View>
          </>
        ) : (
          <MaterialCommunityIcons name="image-outline" size={40} color={colors.card} />
        )}
      </Pressable>

      {imagenesOrdenadas.length > 1 ? (
        <View style={styles.miniaturas}>
          {imagenesOrdenadas.map((imagen) => (
            <Pressable
              key={imagen.idImagen}
              accessibilityRole="button"
              accessibilityLabel="Abrir imagen en pantalla completa"
              onPress={() => abrirVisor(imagen.idImagen)}
              style={[
                styles.miniatura,
                imagen.idImagen === imagenActiva?.idImagen ? styles.miniaturaActiva : null,
              ]}>
              <Image
                source={{ uri: resolverUrlImagen(imagen.url) }}
                style={styles.imagenMiniatura}
              />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Modal
        visible={visorAbierto}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={cerrarVisor}>
        <SafeAreaView style={styles.visorSeguro} edges={['top', 'bottom']}>
          <View style={styles.visorEncabezado}>
            <Text style={styles.contadorVisor}>
              {indiceVisor + 1} de {imagenesVisor.length}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar visor de imágenes"
              onPress={cerrarVisor}
              style={styles.botonCerrar}>
              <MaterialCommunityIcons name="close" size={25} color={colors.card} />
            </Pressable>
          </View>

          <FlatList
            ref={listaRef}
            data={imagenesVisor}
            horizontal
            initialScrollIndex={indiceVisor}
            keyExtractor={(imagen) => imagen.id}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, indice) => ({
              length: anchoPantalla,
              offset: anchoPantalla * indice,
              index: indice,
            })}
            onMomentumScrollEnd={(evento) => {
              const indice = Math.round(
                evento.nativeEvent.contentOffset.x / anchoPantalla,
              );
              setIndiceVisor(indice);
              setImagenActivaId(imagenesOrdenadas[indice]?.idImagen);
            }}
            renderItem={({ item }) => (
              <View style={[styles.diapositive, { width: anchoPantalla }]}>
                <Image
                  accessibilityLabel="Imagen de la publicación"
                  resizeMode="contain"
                  source={{ uri: item.uri }}
                  style={styles.imagenCompleta}
                />
              </View>
            )}
          />

          {imagenesVisor.length > 1 ? (
            <Text style={styles.ayudaVisor}>Desliza para ver las demás imágenes</Text>
          ) : null}
        </SafeAreaView>
      </Modal>
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
  indicadorAmpliar: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,43,73,0.78)',
    borderRadius: 18,
    bottom: 10,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    width: 36,
  },
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
  visorSeguro: { backgroundColor: '#000', flex: 1 },
  visorEncabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.padMd,
    paddingVertical: spacing.padSm,
  },
  contadorVisor: { color: colors.card, fontSize: 14, fontWeight: '700' },
  botonCerrar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  diapositive: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  imagenCompleta: { flex: 1, height: undefined, width: '100%' },
  ayudaVisor: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    paddingBottom: spacing.padMd,
    textAlign: 'center',
  },
});
