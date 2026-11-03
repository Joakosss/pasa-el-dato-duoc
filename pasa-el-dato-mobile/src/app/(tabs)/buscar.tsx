import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PublicacionCard } from '@/components/feed/PublicacionCard';
import { ApiError } from '@/lib/api';
import {
  listarCategorias,
  listarSedes,
  listarTiposVenta,
  type CategoriaCatalogo,
  type SedeCatalogo,
  type TipoVentaCatalogo,
} from '@/lib/api/catalogos';
import {
  listarPublicaciones,
  type PublicacionPublica,
} from '@/lib/api/publicaciones';
import { colors, spacing } from '@/theme';

const FILTRO_TODAS = { id: null, nombre: 'Todas' } as const;

interface FiltrosPublicacion {
  categoriaId: number | null;
  sedeId: number | null;
  tipoVentaId: number | null;
  precioMinimo: string;
  precioMaximo: string;
}

interface FilaGrilla {
  clave: string;
  publicacion: PublicacionPublica | null;
}

const FILTROS_VACIOS: FiltrosPublicacion = {
  categoriaId: null,
  sedeId: null,
  tipoVentaId: null,
  precioMinimo: '',
  precioMaximo: '',
};

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function monto(valor: string): number | null {
  const digitos = valor.replace(/\D/g, '');
  return digitos ? Number(digitos) : null;
}

function formatoPrecio(valor: string): string {
  const precio = monto(valor);
  return precio === null ? '' : new Intl.NumberFormat('es-CL').format(precio);
}

export default function BuscarScreen() {
  const parametros = useLocalSearchParams<{ categoriaId?: string; q?: string; filtros?: string }>();
  const [texto, setTexto] = useState(parametros.q ?? '');
  const [filtros, setFiltros] = useState<FiltrosPublicacion>(FILTROS_VACIOS);
  const [borradorFiltros, setBorradorFiltros] = useState<FiltrosPublicacion>(FILTROS_VACIOS);
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false);
  const [publicaciones, setPublicaciones] = useState<PublicacionPublica[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCatalogo[]>([]);
  const [sedes, setSedes] = useState<SedeCatalogo[]>([]);
  const [tiposVenta, setTiposVenta] = useState<TipoVentaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const categoriaId = Number(parametros.categoriaId);
    const categoriaValida =
      Number.isInteger(categoriaId) && categoriaId > 0 ? categoriaId : null;

    setTexto(parametros.q ?? '');
    setFiltros((actual) => ({ ...actual, categoriaId: categoriaValida }));

  }, [parametros.categoriaId, parametros.q]);

  useFocusEffect(
    useCallback(() => {
      if (parametros.filtros !== '1') return;

      setBorradorFiltros(filtros);
      setModalFiltrosAbierto(true);
      router.setParams({ filtros: undefined });
    }, [filtros, parametros.filtros]),
  );

  const cargarDatos = useCallback(async (esActualizacion = false) => {
    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError(undefined);
    try {
      const [publicacionesRespuesta, categoriasRespuesta, sedesRespuesta, tiposRespuesta] =
        await Promise.all([
          listarPublicaciones(),
          listarCategorias(),
          listarSedes(),
          listarTiposVenta(),
        ]);

      setPublicaciones(publicacionesRespuesta);
      setCategorias(categoriasRespuesta);
      setSedes(sedesRespuesta);
      setTiposVenta(tiposRespuesta);
    } catch (causa: unknown) {
      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos cargar las publicaciones. Reintenta.',
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarDatos();
    }, [cargarDatos]),
  );

  const resultados = useMemo(() => {
    const consulta = normalizar(texto.trim());
    const precioMinimo = monto(filtros.precioMinimo);
    const precioMaximo = monto(filtros.precioMaximo);

    return publicaciones.filter((publicacion) => {
      if (filtros.categoriaId !== null && publicacion.categoria.id !== filtros.categoriaId) {
        return false;
      }
      if (filtros.sedeId !== null && publicacion.sede.id !== filtros.sedeId) {
        return false;
      }
      if (
        filtros.tipoVentaId !== null &&
        publicacion.tipoVenta.id !== filtros.tipoVentaId
      ) {
        return false;
      }
      if (precioMinimo !== null && publicacion.precio < precioMinimo) return false;
      if (precioMaximo !== null && publicacion.precio > precioMaximo) return false;
      if (!consulta) return true;

      return normalizar(
        [
          publicacion.titulo,
          publicacion.descripcion,
          publicacion.categoria.nombre,
          publicacion.tipoVenta.nombre,
          publicacion.sede.nombre,
        ].join(' '),
      ).includes(consulta);
    });
  }, [filtros, publicaciones, texto]);

  const filas = useMemo(() => {
    const items: FilaGrilla[] = resultados.map((publicacion) => ({
      clave: publicacion.id,
      publicacion,
    }));

    if (items.length % 2 === 1) items.push({ clave: 'relleno', publicacion: null });
    return items;
  }, [resultados]);

  const hayFiltros =
    texto.trim().length > 0 ||
    filtros.categoriaId !== null ||
    filtros.sedeId !== null ||
    filtros.tipoVentaId !== null ||
    filtros.precioMinimo !== '' ||
    filtros.precioMaximo !== '';

  const abrirFiltros = () => {
    setBorradorFiltros(filtros);
    setModalFiltrosAbierto(true);
  };

  const aplicarFiltros = () => {
    const minimo = monto(borradorFiltros.precioMinimo);
    const maximo = monto(borradorFiltros.precioMaximo);

    if (minimo !== null && maximo !== null && minimo > maximo) {
      return;
    }

    setFiltros(borradorFiltros);
    setModalFiltrosAbierto(false);
  };

  const limpiar = () => {
    setTexto('');
    setFiltros(FILTROS_VACIOS);
    setBorradorFiltros(FILTROS_VACIOS);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <View style={styles.buscador}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscar por título, categoría, sede…"
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
              style={styles.limpiar}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros"
          onPress={abrirFiltros}
          style={styles.botonFiltros}>
          <MaterialCommunityIcons name="tune-variant" size={20} color={colors.gold} />
          {hayFiltros ? <View style={styles.indicadorFiltro} /> : null}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriasScroll}
        contentContainerStyle={styles.categorias}>
        <FiltroChip
          etiqueta={FILTRO_TODAS.nombre}
          activo={filtros.categoriaId === null}
          onPress={() => setFiltros((actual) => ({ ...actual, categoriaId: null }))}
        />
        {categorias.map((categoria) => (
          <FiltroChip
            key={categoria.id}
            etiqueta={categoria.nombre}
            activo={filtros.categoriaId === categoria.id}
            onPress={() =>
              setFiltros((actual) => ({ ...actual, categoriaId: categoria.id }))
            }
          />
        ))}
      </ScrollView>

      <FlatList
        data={filas}
        keyExtractor={(fila) => fila.clave}
        renderItem={({ item }) => (
          <View style={styles.celda}>
            {item.publicacion ? <PublicacionCard publicacion={item.publicacion} /> : null}
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.fila}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => void cargarDatos(true)}
            tintColor={colors.navy}
          />
        }
        ListHeaderComponent={
          !cargando && !error ? (
            <ResumenResultados
              total={resultados.length}
              hayFiltros={hayFiltros}
              onLimpiar={limpiar}
            />
          ) : null
        }
        ListEmptyComponent={
          cargando ? (
            <EstadoLista mensaje="Cargando publicaciones…" />
          ) : error ? (
            <EstadoLista mensaje={error} esError onReintentar={() => void cargarDatos()} />
          ) : (
            <SinResultados hayFiltros={hayFiltros} onLimpiar={limpiar} />
          )
        }
      />

      <Modal
        visible={modalFiltrosAbierto}
        animationType="slide"
        transparent
        onRequestClose={() => setModalFiltrosAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalEncabezado}>
              <View>
                <Text style={styles.modalTitulo}>Filtrar publicaciones</Text>
                <Text style={styles.modalSubtitulo}>Todos los filtros son opcionales.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar filtros"
                onPress={() => setModalFiltrosAbierto(false)}
                style={styles.cerrar}>
                <MaterialCommunityIcons name="close" size={22} color={colors.navy} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <SeccionOpciones
                titulo="Categoría"
                opciones={categorias}
                seleccionadoId={borradorFiltros.categoriaId}
                onSeleccionar={(categoriaId) =>
                  setBorradorFiltros((actual) => ({ ...actual, categoriaId }))
                }
              />
              <SeccionOpciones
                titulo="Sede"
                opciones={sedes}
                seleccionadoId={borradorFiltros.sedeId}
                onSeleccionar={(sedeId) =>
                  setBorradorFiltros((actual) => ({ ...actual, sedeId }))
                }
              />
              <SeccionOpciones
                titulo="Tipo de venta"
                opciones={tiposVenta}
                seleccionadoId={borradorFiltros.tipoVentaId}
                onSeleccionar={(tipoVentaId) =>
                  setBorradorFiltros((actual) => ({ ...actual, tipoVentaId }))
                }
              />

              <Text style={styles.etiqueta}>Rango de precio</Text>
              <View style={styles.rangoPrecio}>
                <View style={styles.inputPrecio}>
                  <Text style={styles.signoPeso}>$</Text>
                  <TextInput
                    value={borradorFiltros.precioMinimo}
                    onChangeText={(precioMinimo) =>
                      setBorradorFiltros((actual) => ({
                        ...actual,
                        precioMinimo: formatoPrecio(precioMinimo),
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="Mínimo"
                    placeholderTextColor={colors.muted}
                    style={styles.inputPrecioTexto}
                  />
                </View>
                <Text style={styles.separadorRango}>—</Text>
                <View style={styles.inputPrecio}>
                  <Text style={styles.signoPeso}>$</Text>
                  <TextInput
                    value={borradorFiltros.precioMaximo}
                    onChangeText={(precioMaximo) =>
                      setBorradorFiltros((actual) => ({
                        ...actual,
                        precioMaximo: formatoPrecio(precioMaximo),
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="Máximo"
                    placeholderTextColor={colors.muted}
                    style={styles.inputPrecioTexto}
                  />
                </View>
              </View>
              {(() => {
                const minimo = monto(borradorFiltros.precioMinimo);
                const maximo = monto(borradorFiltros.precioMaximo);
                return minimo !== null && maximo !== null && minimo > maximo ? (
                  <Text style={styles.errorPrecio}>El precio mínimo no puede superar el máximo.</Text>
                ) : null;
              })()}
            </ScrollView>

            <View style={styles.accionesModal}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setBorradorFiltros(FILTROS_VACIOS)}
                style={styles.botonLimpiar}>
                <Text style={styles.botonLimpiarTexto}>Limpiar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={aplicarFiltros}
                style={styles.botonAplicar}>
                <Text style={styles.botonAplicarTexto}>Aplicar filtros</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SeccionOpciones({
  titulo,
  opciones,
  seleccionadoId,
  onSeleccionar,
}: {
  titulo: string;
  opciones: Array<{ id: number; nombre: string }>;
  seleccionadoId: number | null;
  onSeleccionar: (id: number | null) => void;
}) {
  return (
    <View style={styles.seccionFiltro}>
      <Text style={styles.etiqueta}>{titulo}</Text>
      <View style={styles.opciones}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: seleccionadoId === null }}
          onPress={() => onSeleccionar(null)}
          style={[styles.opcion, seleccionadoId === null && styles.opcionActiva]}>
          <Text style={[styles.opcionTexto, seleccionadoId === null && styles.opcionTextoActiva]}>
            Cualquiera
          </Text>
        </Pressable>
        {opciones.map((opcion) => (
          <Pressable
            key={opcion.id}
            accessibilityRole="button"
            accessibilityState={{ selected: seleccionadoId === opcion.id }}
            onPress={() => onSeleccionar(opcion.id)}
            style={[styles.opcion, seleccionadoId === opcion.id && styles.opcionActiva]}>
            <Text
              style={[
                styles.opcionTexto,
                seleccionadoId === opcion.id && styles.opcionTextoActiva,
              ]}>
              {opcion.nombre}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FiltroChip({
  etiqueta,
  activo,
  onPress,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[styles.chip, activo && styles.chipActivo]}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{etiqueta}</Text>
    </Pressable>
  );
}

function ResumenResultados({
  total,
  hayFiltros,
  onLimpiar,
}: {
  total: number;
  hayFiltros: boolean;
  onLimpiar: () => void;
}) {
  return (
    <View style={styles.resumen}>
      <Text style={styles.resumenTexto}>
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </Text>
      {hayFiltros ? (
        <Pressable accessibilityRole="button" onPress={onLimpiar} style={styles.limpiarFiltros}>
          <MaterialCommunityIcons name="filter-variant-remove" size={15} color={colors.navy} />
          <Text style={styles.limpiarFiltrosTexto}>Limpiar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EstadoLista({
  mensaje,
  esError = false,
  onReintentar,
}: {
  mensaje: string;
  esError?: boolean;
  onReintentar?: () => void;
}) {
  return (
    <View style={styles.vacio}>
      {esError ? (
        <MaterialCommunityIcons name="alert-circle-outline" size={30} color={colors.error} />
      ) : (
        <ActivityIndicator color={colors.navy} />
      )}
      <Text style={[styles.vacioMensaje, esError && styles.errorTexto]}>{mensaje}</Text>
      {onReintentar ? (
        <Pressable accessibilityRole="button" onPress={onReintentar} style={styles.vacioBoton}>
          <Text style={styles.vacioBotonTexto}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

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
        No encontramos publicaciones con esos criterios. Prueba con otros filtros.
      </Text>
      {hayFiltros ? (
        <Pressable accessibilityRole="button" onPress={onLimpiar} style={styles.vacioBoton}>
          <Text style={styles.vacioBotonTexto}>Limpiar filtros</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  barra: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
  },
  buscador: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padSm,
  },
  input: { color: colors.navy, flex: 1, fontSize: 14, minWidth: 0, paddingVertical: 6 },
  limpiar: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  botonFiltros: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: spacing.radiusMd,
    height: spacing.touchMin,
    justifyContent: 'center',
    position: 'relative',
    width: spacing.touchMin,
  },
  indicadorFiltro: {
    backgroundColor: colors.gold,
    borderColor: colors.card,
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    position: 'absolute',
    right: 3,
    top: 3,
    width: 10,
  },
  categoriasScroll: { backgroundColor: colors.card, flexGrow: 0 },
  categorias: { gap: 8, paddingBottom: spacing.padSm, paddingHorizontal: spacing.padMd },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.padSm,
  },
  chipActivo: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipTexto: { color: colors.navy, fontSize: 12, fontWeight: '600' },
  chipTextoActivo: { color: colors.gold },
  contenido: {
    gap: spacing.padMd,
    paddingBottom: spacing.padLg,
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padSm,
  },
  fila: { gap: spacing.padSm },
  celda: { flex: 1 },
  resumen: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resumenTexto: { color: colors.muted, fontSize: 13 },
  limpiarFiltros: { alignItems: 'center', flexDirection: 'row', gap: 4, minHeight: 32 },
  limpiarFiltrosTexto: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  vacio: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    padding: spacing.padLg,
  },
  vacioIcono: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.padSm,
    width: 56,
  },
  vacioTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  vacioMensaje: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  errorTexto: { color: colors.error },
  vacioBoton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    marginTop: spacing.padSm,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  vacioBotonTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  overlay: {
    backgroundColor: 'rgba(0,43,73,0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: spacing.radiusLg,
    borderTopRightRadius: spacing.radiusLg,
    maxHeight: '88%',
    padding: spacing.padLg,
  },
  modalEncabezado: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.padMd },
  modalTitulo: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  modalSubtitulo: { color: colors.muted, fontSize: 13, marginTop: 2 },
  cerrar: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  seccionFiltro: { gap: 8, marginBottom: spacing.padLg },
  etiqueta: { color: colors.navy, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.padSm,
    paddingVertical: 8,
  },
  opcionActiva: { backgroundColor: colors.navy, borderColor: colors.navy },
  opcionTexto: { color: colors.navy, fontSize: 13, fontWeight: '600' },
  opcionTextoActiva: { color: colors.gold },
  rangoPrecio: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  inputPrecio: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padSm,
  },
  signoPeso: { color: colors.muted, fontWeight: '700' },
  inputPrecioTexto: { color: colors.navy, flex: 1, fontSize: 14, paddingVertical: 6 },
  separadorRango: { color: colors.muted },
  errorPrecio: { color: colors.error, fontSize: 12, marginTop: -4 },
  accionesModal: { flexDirection: 'row', gap: 10, marginTop: spacing.padMd },
  botonLimpiar: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonLimpiarTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  botonAplicar: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flex: 2,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonAplicarTexto: { color: colors.navy, fontSize: 14, fontWeight: '800' },
});
