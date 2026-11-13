import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  FORMATOS_IMAGEN,
  IMAGENES_MAX,
  PESO_MAX_IMAGEN_MB,
} from '@/lib/validators/publicacion';
import { colors, spacing } from '@/theme';

export interface ImagenVistaPrevia {
  id: string;
  uri: string;
}

export function SelectorImagenes({
  imagenes,
  onSeleccionarGaleria,
  onTomarFoto,
  onQuitar,
  error,
  deshabilitado = false,
}: {
  imagenes: readonly ImagenVistaPrevia[];
  onSeleccionarGaleria: () => void;
  onTomarFoto: () => void;
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
        <View style={[styles.vacia, error ? styles.conError : null, deshabilitado && styles.deshabilitado]}>
          <MaterialCommunityIcons name="image-plus" size={28} color={colors.gold} />
          <Text style={styles.vaciaTitulo}>Agrega una foto</Text>
          <Text style={styles.vaciaTexto}>Elige una imagen o toma una foto de tu producto</Text>
          <View style={styles.acciones}>
            <BotonOrigen
              icono="image-outline"
              etiqueta="Galería"
              deshabilitado={deshabilitado}
              onPress={onSeleccionarGaleria}
            />
            <BotonOrigen
              icono="camera-outline"
              etiqueta="Tomar foto"
              deshabilitado={deshabilitado}
              onPress={onTomarFoto}
              primario
            />
          </View>
        </View>
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
            <>
              <BotonMiniatura
                icono="image-plus"
                etiqueta="Agregar desde galería"
                deshabilitado={deshabilitado}
                onPress={onSeleccionarGaleria}
              />
              <BotonMiniatura
                icono="camera-plus-outline"
                etiqueta="Tomar otra foto"
                deshabilitado={deshabilitado}
                onPress={onTomarFoto}
              />
            </>
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

function BotonOrigen({
  icono,
  etiqueta,
  deshabilitado,
  onPress,
  primario = false,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  etiqueta: string;
  deshabilitado: boolean;
  onPress: () => void;
  primario?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botonOrigen,
        primario && styles.botonOrigenPrimario,
        pressed && styles.pressed,
      ]}>
      <MaterialCommunityIcons name={icono} size={18} color={primario ? colors.navy : colors.navy} />
      <Text style={styles.botonOrigenTexto}>{etiqueta}</Text>
    </Pressable>
  );
}

function BotonMiniatura({
  icono,
  etiqueta,
  deshabilitado,
  onPress,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  etiqueta: string;
  deshabilitado: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.agregarMini,
        deshabilitado && styles.deshabilitado,
        pressed && styles.pressed,
      ]}>
      <MaterialCommunityIcons name={icono} size={20} color={colors.navy} />
    </Pressable>
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
    minHeight: 200,
    justifyContent: 'center',
    padding: spacing.padMd,
  },
  vaciaTitulo: { color: colors.navy, fontSize: 14, fontWeight: '700', marginTop: 6 },
  vaciaTexto: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  acciones: { flexDirection: 'row', gap: spacing.padSm, marginTop: spacing.padSm, width: '100%' },
  botonOrigen: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 40,
  },
  botonOrigenPrimario: { backgroundColor: colors.gold, borderColor: colors.gold },
  botonOrigenTexto: { color: colors.navy, fontSize: 12, fontWeight: '700' },
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
