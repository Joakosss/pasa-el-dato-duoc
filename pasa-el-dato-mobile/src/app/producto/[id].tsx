import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { PublicacionCard } from '@/components/feed/PublicacionCard';
import { GaleriaProducto } from '@/components/producto/GaleriaProducto';
import { TarjetaVendedor } from '@/components/producto/TarjetaVendedor';
import {
  buscarPublicacion,
  publicacionesRelacionadas,
} from '@/lib/feed/publicaciones-placeholder';

// Detalle de producto: espejo de la vista web product/[id] (galería, categoría,
// título, precio, descripción, detalles, vendedor, acción y relacionadas).
// Sin contrato back todavía: los datos vienen del placeholder del feed.
const RELACIONADAS = 4;

export default function DetalleProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const publicacion = buscarPublicacion(id);

  if (!publicacion) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Encabezado />
        <View style={styles.vacio}>
          <View style={styles.vacioIcono}>
            <MaterialCommunityIcons
              name="package-variant-closed-remove"
              size={26}
              color={colors.gold}
            />
          </View>
          <Text style={styles.vacioTitulo}>Publicación no encontrada</Text>
          <Text style={styles.vacioTexto}>
            Puede que ya no esté disponible o que el enlace no sea válido.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
            onPress={() => router.replace('/inicio')}
            style={({ pressed }) => [styles.vacioBoton, pressed && styles.pressed]}>
            <Text style={styles.vacioBotonTexto}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const detalles = [
    { etiqueta: 'Categoría', valor: publicacion.categoria },
    { etiqueta: 'Tipo', valor: publicacion.tipo },
    { etiqueta: 'Condición', valor: publicacion.condicion },
    { etiqueta: 'Sede', valor: publicacion.sede },
  ];

  const relacionadas = publicacionesRelacionadas(publicacion.id, RELACIONADAS);
  // Dos filas de dos tarjetas: la grilla queda siempre completa.
  const filas = [relacionadas.slice(0, 2), relacionadas.slice(2, 4)].filter(
    (fila) => fila.length > 0,
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Encabezado />

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}>
        <GaleriaProducto />

        <View style={styles.etiquetas}>
          <View style={styles.etiquetaCategoria}>
            <Text style={styles.etiquetaCategoriaTexto}>
              {publicacion.categoria}
            </Text>
          </View>
          {publicacion.patrocinada ? (
            <View style={styles.etiquetaPatrocinada}>
              <Text style={styles.etiquetaPatrocinadaTexto}>Patrocinado</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.titulo}>{publicacion.titulo}</Text>
        <Text style={styles.precio}>{publicacion.precio}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaTexto}>{publicacion.condicion}</Text>
          <Text style={styles.metaSeparador}>|</Text>
          <Text style={styles.metaTexto}>{publicacion.tipo}</Text>
          <Text style={styles.metaSeparador}>|</Text>
          <Text style={styles.metaTexto}>Sede {publicacion.sede}</Text>
        </View>

        <Text style={styles.seccionTitulo}>Descripción</Text>
        <Text style={styles.descripcion}>{publicacion.descripcion}</Text>

        <View style={styles.detalles}>
          <Text style={styles.detallesTitulo}>Detalles del producto</Text>
          <View style={styles.detallesGrilla}>
            {detalles.map((detalle) => (
              <View key={detalle.etiqueta} style={styles.detalleItem}>
                <Text style={styles.detalleEtiqueta}>{detalle.etiqueta}</Text>
                <Text style={styles.detalleValor}>{detalle.valor}</Text>
              </View>
            ))}
          </View>
        </View>

        <TarjetaVendedor
          nombre={publicacion.vendedor}
          sede={publicacion.sede}
        />

        <View style={styles.accion}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Contactar vendedor"
            onPress={() => router.push('/chats')}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaTexto}>Contactar vendedor</Text>
          </Pressable>
          <Text style={styles.ctaAyuda}>
            Te redirigiremos al chat para coordinar el intercambio
          </Text>
        </View>

        <View style={styles.seccionBarra}>
          <Text style={styles.seccionTitulo}>Productos relacionados</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todas las publicaciones"
            onPress={() => router.push('/buscar')}
            style={({ pressed }) => [styles.verTodo, pressed && styles.pressed]}>
            <Text style={styles.verTodoTexto}>Ver todo</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={14}
              color={colors.navy}
            />
          </Pressable>
        </View>

        {filas.map((fila, indice) => (
          <View key={`fila-${indice}`} style={styles.filaTarjetas}>
            {fila.map((relacionada) => (
              <View key={relacionada.id} style={styles.celda}>
                <PublicacionCard publicacion={relacionada} />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Barra superior con el regreso: la ruta vive fuera de (tabs), sin menú.
function Encabezado() {
  const volver = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/inicio');
  };

  return (
    <View style={styles.barra}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={volver}
        style={({ pressed }) => [styles.volver, pressed && styles.pressed]}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={22}
          color={colors.navy}
        />
      </Pressable>
      <Text style={styles.barraTitulo} numberOfLines={1}>
        Detalle del producto
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.padSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  volver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraTitulo: {
    flexShrink: 1,
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  contenido: {
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padMd,
    paddingBottom: spacing.padLg,
    gap: spacing.padMd,
  },
  etiquetas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etiquetaCategoria: {
    backgroundColor: colors.navy,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etiquetaCategoriaTexto: {
    color: colors.card,
    fontSize: 11,
    fontWeight: '600',
  },
  etiquetaPatrocinada: {
    backgroundColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etiquetaPatrocinadaTexto: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '800',
  },
  titulo: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  precio: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '900',
    marginTop: -8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8,
  },
  metaTexto: {
    color: colors.muted,
    fontSize: 13,
  },
  metaSeparador: {
    color: colors.muted,
    fontSize: 13,
  },
  seccionTitulo: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  descripcion: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -8,
  },
  detalles: {
    padding: spacing.padMd,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
  },
  detallesTitulo: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.padSm,
  },
  detallesGrilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  detalleItem: {
    width: '50%',
    gap: 2,
  },
  detalleEtiqueta: {
    color: colors.muted,
    fontSize: 12,
  },
  detalleValor: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  accion: {
    gap: 6,
  },
  cta: {
    minHeight: spacing.touchMin + 4,
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTexto: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  ctaAyuda: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  seccionBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verTodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingLeft: 8,
  },
  verTodoTexto: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  filaTarjetas: {
    flexDirection: 'row',
    gap: spacing.padSm,
    marginTop: -4,
  },
  celda: {
    flex: 1,
  },
  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.padLg,
    gap: 4,
  },
  vacioIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.padSm,
  },
  vacioTitulo: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  vacioTexto: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  vacioBoton: {
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    marginTop: spacing.padLg,
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacioBotonTexto: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
