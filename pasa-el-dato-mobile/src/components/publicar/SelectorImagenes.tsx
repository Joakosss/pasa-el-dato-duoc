import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';
import {
  FORMATOS_IMAGEN,
  IMAGENES_MAX,
  PESO_MAX_IMAGEN_MB,
} from '@/lib/validators/publicacion';

export interface ImagenVistaPrevia {
  id: string;
  uri: string;
}

export function SelectorImagenes({
  imagenes,
  onAgregar,
  onQuitar,
  error,
  deshabilitado = false,
}: {
  imagenes: readonly ImagenVistaPrevia[];
  onAgregar: () => void;
  onQuitar: (id: string) => void;
  error?: string;
  deshabilitado?: boolean;
}) {
  const [portada, ...resto] = imagenes;
  const puedeAgregar = imagenes.length < IMAGENES_MAX;

  return (
    <View style={styles.bloque}>
      <View style={styles.encabezado}>
        <Text style={styles.etiqueta}>Foto o portada *</Text>
        <Text style={styles.contador}>
          {imagenes.length}/{IMAGENES_MAX}
        </Text>
      </View>

      {portada ? (
        <View style={[styles.portada, error ? styles.conError : null]}>
          <Image source={{ uri: portada.uri }} style={styles.imagenPortada} />
          <View style={styles.etiquetaPortada}>
            <Text style={styles.portadaTexto}>Portada</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar portada"
            disabled={deshabilitado}
            onPress={() => onQuitar(portada.id)}
            style={({ pressed }) => [styles.quitar, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="close" size={15} color={colors.card} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar foto de portada"
          disabled={deshabilitado}
          onPress={onAgregar}
          style={({ pressed }) => [
            styles.vacia,
            error ? styles.conError : null,
            deshabilitado && styles.deshabilitado,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons name="image-plus" size={28} color={colors.gold} />
          <Text style={styles.vaciaTitulo}>Agregar foto</Text>
          <Text style={styles.vaciaTexto}>Selecciona una imagen desde tu galería</Text>
        </Pressable>
      )}

      {imagenes.length > 0 ? (
        <View style={styles.miniaturas}>
          {resto.map((imagen) => (
            <View key={imagen.id} style={styles.miniatura}>
              <Image source={{ uri: imagen.uri }} style={styles.imagenMiniatura} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar imagen"
                disabled={deshabilitado}
                onPress={() => onQuitar(imagen.id)}
                style={({ pressed }) => [
                  styles.quitar,
                  styles.quitarMini,
                  pressed && styles.pressed,
                ]}>
                <MaterialCommunityIcons name="close" size={12} color={colors.card} />
              </Pressable>
            </View>
          ))}

          {puedeAgregar ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Agregar otra imagen"
              disabled={deshabilitado}
              onPress={onAgregar}
              style={({ pressed }) => [
                styles.agregarMini,
                deshabilitado && styles.deshabilitado,
                pressed && styles.pressed,
              ]}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.navy} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.ayuda}>
        Hasta {IMAGENES_MAX} imágenes · {FORMATOS_IMAGEN.join(', ')} · máx.{' '}
        {PESO_MAX_IMAGEN_MB} MB cada una
      </Text>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: spacing.padSm },
  encabezado: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  etiqueta: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  contador: { color: colors.muted, fontSize: 12 },
  portada: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 2,
    height: 200,
    overflow: 'hidden',
  },
  imagenPortada: { height: '100%', width: '100%' },
  etiquetaPortada: {
    backgroundColor: 'rgba(0,43,73,0.78)',
    bottom: 0,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    right: 0,
  },
  portadaTexto: { color: colors.card, fontSize: 13, fontWeight: '700' },
  vacia: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: 2,
    height: 200,
    justifyContent: 'center',
  },
  vaciaTitulo: { color: colors.navy, fontSize: 14, fontWeight: '700', marginTop: 6 },
  vaciaTexto: { color: colors.muted, fontSize: 12 },
  miniaturas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniatura: {
    backgroundColor: colors.border,
    borderRadius: spacing.radiusSm,
    height: 64,
    overflow: 'hidden',
    width: 64,
  },
  imagenMiniatura: { height: '100%', width: '100%' },
  agregarMini: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  quitar: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
  },
  quitarMini: { borderRadius: 10, height: 20, right: 2, top: 2, width: 20 },
  ayuda: { color: colors.muted, fontSize: 12 },
  error: { color: colors.error, fontSize: 13, marginTop: -4 },
  conError: { borderColor: colors.error },
  deshabilitado: { opacity: 0.6 },
  pressed: { opacity: 0.9 },
});
