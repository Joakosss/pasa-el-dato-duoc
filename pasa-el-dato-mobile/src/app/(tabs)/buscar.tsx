import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { PublicacionCard } from '@/components/feed/PublicacionCard';
import { filtrarPublicaciones } from '@/lib/feed/filtrar-publicaciones';
import {
  CATEGORIAS_FEED,
  type NombreIcono,
  type PublicacionFeed,
} from '@/lib/feed/publicaciones-placeholder';

// Búsqueda: barra interactiva, filtros rápidos por categoría (mismo catálogo del
// inicio) y resultados en grilla de dos columnas con la misma tarjeta del feed.
// Los datos siguen siendo el placeholder del cliente: no hay contrato back de
// publicaciones todavía. Cada tarjeta abre /producto/[id].
const FILTRO_TODAS = { etiqueta: 'Todas', icono: 'view-grid-outline' } as const;

// Fila de la grilla: la última puede ser un relleno vacío para que una tarjeta
// suelta no ocupe todo el ancho.
interface FilaGrilla {
  clave: string;
  publicacion: PublicacionFeed | null;
}

export default function BuscarScreen() {
  const [texto, setTexto] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  const resultados = useMemo(
    () => filtrarPublicaciones({ texto, categoriaId }),
    [texto, categoriaId],
  );

  const filas = useMemo(() => {
    const items: FilaGrilla[] = resultados.map((publicacion) => ({
      clave: publicacion.id,
      publicacion,
    }));

    if (items.length % 2 === 1) {
      items.push({ clave: 'relleno', publicacion: null });
    }

    return items;
  }, [resultados]);

  const hayFiltros = texto.trim().length > 0 || categoriaId !== null;

  const limpiar = () => {
    setTexto('');
    setCategoriaId(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <View style={styles.buscador}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />

          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar libros, electrónica, servicios..."
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={colors.navy}
            accessibilityLabel="Buscar publicaciones"
            style={styles.input}
          />

          {texto.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
              onPress={() => setTexto('')}
              style={({ pressed }) => [styles.limpiar, pressed && styles.pressed]}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color={colors.muted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
        contentContainerStyle={styles.categorias}>
        <FiltroChip
          etiqueta={FILTRO_TODAS.etiqueta}
          icono={FILTRO_TODAS.icono}
          activo={categoriaId === null}
          onPress={() => setCategoriaId(null)}
        />

        {CATEGORIAS_FEED.map((categoria) => (
          <FiltroChip
            key={categoria.id}
            etiqueta={categoria.etiqueta}
            icono={categoria.icono}
            activo={categoriaId === categoria.id}
            onPress={() => setCategoriaId(categoria.id)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filas}
        keyExtractor={(fila) => fila.clave}
        renderItem={({ item }) =>
          item.publicacion ? (
            <View style={styles.celda}>
              <PublicacionCard publicacion={item.publicacion} />
            </View>
          ) : (
            <View style={styles.celda} />
          )
        }
        numColumns={2}
        columnWrapperStyle={styles.fila}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <ResumenResultados
            total={resultados.length}
            hayFiltros={hayFiltros}
            onLimpiar={limpiar}
          />
        }
        ListEmptyComponent={
          <SinResultados hayFiltros={hayFiltros} onLimpiar={limpiar} />
        }
      />
    </SafeAreaView>
  );
}

// Filtro rápido de categoría. Activo: fondo azul marino con acento dorado.
function FiltroChip({
  etiqueta,
  icono,
  activo,
  onPress,
}: {
  etiqueta: string;
  icono: NombreIcono;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${etiqueta}`}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        activo && styles.chipActivo,
        pressed && styles.pressed,
      ]}>
      <MaterialCommunityIcons
        name={icono}
        size={15}
        color={activo ? colors.gold : colors.navy}
      />
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
        {etiqueta}
      </Text>
    </Pressable>
  );
}

// Conteo de resultados y acceso directo a limpiar los criterios.
function ResumenResultados({
  total,
  hayFiltros,
  onLimpiar,
}: {
  total: number;
  hayFiltros: boolean;
  onLimpiar: () => void;
}) {
  if (total === 0) {
    return null;
  }

  return (
    <View style={styles.resumen}>
      <Text style={styles.resumenTexto}>
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </Text>

      {hayFiltros ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar filtros"
          onPress={onLimpiar}
          style={({ pressed }) => [styles.limpiarFiltros, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="filter-variant" size={14} color={colors.navy} />
          <Text style={styles.limpiarFiltrosTexto}>Limpiar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// Espejo del estado vacío de chats, con los criterios de búsqueda.
function SinResultados({
  hayFiltros,
  onLimpiar,
}: {
  hayFiltros: boolean;
  onLimpiar: () => void;
}) {
  return (
    <View style={styles.vacio}>
      <View style={styles.vacioIcono}>
        <MaterialCommunityIcons name="magnify-close" size={26} color={colors.gold} />
      </View>

      <Text style={styles.vacioTitulo}>Sin resultados</Text>
      <Text style={styles.vacioMensaje}>
        No encontramos publicaciones con esos criterios. Prueba con otra palabra
        o cambia de categoría.
      </Text>

      {hayFiltros ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar filtros y buscar de nuevo"
          onPress={onLimpiar}
          style={({ pressed }) => [styles.vacioBoton, pressed && styles.pressed]}>
          <Text style={styles.vacioBotonTexto}>Limpiar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  barra: {
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padSm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.navy,
    fontSize: 14,
    paddingVertical: 6,
  },
  limpiar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriasScroll: {
    // La fila de filtros solo ocupa el alto de los chips.
    flexGrow: 0,
    backgroundColor: colors.card,
  },
  categorias: {
    gap: 8,
    paddingHorizontal: spacing.padMd,
    paddingBottom: spacing.padSm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.padSm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
  },
  chipActivo: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipTexto: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextoActivo: {
    color: colors.gold,
  },
  contenido: {
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padSm,
    paddingBottom: spacing.padLg,
    gap: spacing.padMd,
  },
  fila: {
    gap: spacing.padSm,
  },
  celda: {
    flex: 1,
  },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.padSm,
  },
  resumenTexto: {
    color: colors.muted,
    fontSize: 13,
  },
  limpiarFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingLeft: 8,
  },
  limpiarFiltrosTexto: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  vacio: {
    alignItems: 'center',
    padding: spacing.padLg,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
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
  vacioMensaje: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
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
