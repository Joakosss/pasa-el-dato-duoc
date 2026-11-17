import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

const BANNERS_PUBLICIDAD_MOMENTANEO = [
  {
    id: 'cafeteria-campus',
    marca: 'Café Campus',
    mensaje: '15% de descuento mostrando tu credencial Duoc.',
    icono: 'coffee-outline' as const,
    color: '#7c3f1d',
    colorAcento: '#f9d798',
  },
  {
    id: 'libreria-duoc',
    marca: 'Librería Punto Norte',
    mensaje: 'Cuadernos, apuntes y accesorios para tu semestre.',
    icono: 'book-open-page-variant-outline' as const,
    color: '#255c85',
    colorAcento: '#c4e6ff',
  },
  {
    id: 'tech-store',
    marca: 'Tech Store',
    mensaje: 'Equípate para clases: cables, audífonos y más.',
    icono: 'headphones' as const,
    color: '#3c356f',
    colorAcento: '#ddd6ff',
  },
  {
    id: 'comida-casera',
    marca: 'Sazón Casero',
    mensaje: 'Almuerzos frescos cerca de tu sede. ¡Pide hoy!',
    icono: 'food-fork-drink' as const,
    color: '#356846',
    colorAcento: '#d7f2c8',
  },
] as const;

export function BannersPublicidadMomentaneo() {
  return (
    <View style={styles.seccion}>
      <View style={styles.encabezado}>
        <MaterialCommunityIcons name="star-four-points-outline" size={14} color={colors.muted} />
        <Text style={styles.etiqueta}>Patrocinado</Text>
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.carrusel}
        showsHorizontalScrollIndicator={false}>
        {BANNERS_PUBLICIDAD_MOMENTANEO.map((banner) => (
          <View
            key={banner.id}
            accessibilityLabel={`Contenido patrocinado de demostración: ${banner.marca}`}
            style={[styles.tarjeta, { backgroundColor: banner.color }]}>
            <View style={[styles.icono, { backgroundColor: banner.colorAcento }]}>
              <MaterialCommunityIcons name={banner.icono} size={24} color={banner.color} />
            </View>
            <View style={styles.contenido}>
              <Text style={styles.marca} numberOfLines={1}>
                {banner.marca}
              </Text>
              <Text style={styles.mensaje} numberOfLines={2}>
                {banner.mensaje}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    marginTop: spacing.padMd,
    overflow: 'hidden',
  },
  encabezado: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: spacing.padSm,
    paddingVertical: 6,
  },
  etiqueta: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  carrusel: { gap: spacing.padSm, padding: spacing.padSm },
  tarjeta: {
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: spacing.padSm,
    minHeight: 96,
    padding: spacing.padSm,
    width: 270,
  },
  icono: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  contenido: { flex: 1, justifyContent: 'center' },
  marca: { color: colors.card, fontSize: 14, fontWeight: '800' },
  mensaje: { color: 'rgba(255,255,255,0.86)', fontSize: 12, lineHeight: 17, marginTop: 3 },
});
