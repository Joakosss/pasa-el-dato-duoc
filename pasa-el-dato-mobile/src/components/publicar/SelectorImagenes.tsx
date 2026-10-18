import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';
import {
  FORMATOS_IMAGEN,
  IMAGENES_MAX,
  PESO_MAX_IMAGEN_MB,
} from '@/lib/validators/publicacion';

// Foto o portada de la publicación. Simulador visual: todavía no hay selector
// real de galería porque el almacenamiento de imágenes depende del contrato de
// publicaciones. Se respetan las reglas de HU-PUB-01 (de 1 a 5 imágenes).
// La primera imagen agregada hace de portada.
export function SelectorImagenes({
  imagenes,
  onAgregar,
  onQuitar,
  error,
}: {
  imagenes: readonly string[];
  onAgregar: () => void;
  onQuitar: (id: string) => void;
  error?: string;
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

      {portada !== undefined ? (
        <View style={[styles.portada, error ? styles.conError : null]}>
          <MaterialCommunityIcons
            name="image-outline"
            size={38}
            color={colors.card}
          />
          <Text style={styles.portadaTexto}>Portada</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar portada"
            onPress={() => onQuitar(portada)}
            style={({ pressed }) => [styles.quitar, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="close" size={15} color={colors.card} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar foto de portada"
          onPress={onAgregar}
          style={({ pressed }) => [
            styles.vacia,
            error ? styles.conError : null,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons
            name="camera-plus-outline"
            size={28}
            color={colors.gold}
          />
          <Text style={styles.vaciaTitulo}>Agregar foto</Text>
          <Text style={styles.vaciaTexto}>Toca para simular la portada</Text>
        </Pressable>
      )}

      {imagenes.length > 0 ? (
        <View style={styles.miniaturas}>
          {resto.map((id) => (
            <View key={id} style={styles.miniatura}>
              <MaterialCommunityIcons
                name="image-outline"
                size={18}
                color={colors.card}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar imagen"
                onPress={() => onQuitar(id)}
                style={({ pressed }) => [
                  styles.quitar,
                  styles.quitarMini,
                  pressed && styles.pressed,
                ]}>
                <MaterialCommunityIcons
                  name="close"
                  size={12}
                  color={colors.card}
                />
              </Pressable>
            </View>
          ))}

          {puedeAgregar ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Agregar otra imagen"
              onPress={onAgregar}
              style={({ pressed }) => [
                styles.agregarMini,
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
      <Text style={styles.nota}>
        Las fotos se cargarán desde tu galería cuando exista el contrato de
        publicaciones.
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
  bloque: {
    gap: spacing.padSm,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etiqueta: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  contador: {
    color: colors.muted,
    fontSize: 12,
  },
  portada: {
    height: 200,
    borderRadius: spacing.radiusLg,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  portadaTexto: {
    color: colors.card,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  vacia: {
    height: 200,
    borderRadius: spacing.radiusLg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  vaciaTitulo: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  vaciaTexto: {
    color: colors.muted,
    fontSize: 12,
  },
  miniaturas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniatura: {
    width: 64,
    height: 64,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agregarMini: {
    width: 64,
    height: 64,
    borderRadius: spacing.radiusSm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitar: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    top: 2,
    right: 2,
  },
  ayuda: {
    color: colors.muted,
    fontSize: 12,
  },
  nota: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    marginTop: -4,
  },
  conError: {
    borderColor: colors.error,
  },
  pressed: {
    opacity: 0.9,
  },
});
