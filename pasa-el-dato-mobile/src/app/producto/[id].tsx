import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GaleriaProducto } from '@/components/producto/GaleriaProducto';
import { ConsentimientoRecomendaciones } from '@/components/publicar/ConsentimientoRecomendaciones';
import { useFavorito } from '@/hooks/use-favorito';
import { ApiError } from '@/lib/api';
import { clasificarErrorDetallePublicacion, type ErrorDetallePublicacion } from '@/lib/api/error-detalle-publicacion';
import {
  eliminarPublicacion,
  obtenerPublicacion,
  type PublicacionDetalle,
} from '@/lib/api/publicaciones';
import { obtenerPublicacionDemostracionMomentaneo } from '@/lib/feed/publicaciones-demostracion-momentaneo';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

function precioClp(precio: number): string {
  return `$${new Intl.NumberFormat('es-CL').format(precio)}`;
}

export default function DetalleProductoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accessToken = useSesionStore(selectAccessToken);
  const { esFavorito, cargando: cargandoFavorito, actualizando: actualizandoFavorito, errorCarga: errorFavorito,
    reintentar: reintentarFavorito, alternar: alternarFavorito } =
    useFavorito(
      id && !obtenerPublicacionDemostracionMomentaneo(id) ? id : undefined,
      accessToken,
    );
  const [publicacion, setPublicacion] = useState<PublicacionDetalle | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState<string | undefined>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ErrorDetallePublicacion | undefined>();

  const cargarPublicacion = useCallback(async () => {
    if (!id) {
      setCargando(false);
      setError({ mensaje: 'La publicación no es válida.', reintentable: false });
      return;
    }

    setCargando(true);
    setError(undefined);

    const publicacionDemostracionMomentaneo =
      obtenerPublicacionDemostracionMomentaneo(id);
    if (publicacionDemostracionMomentaneo) {
      setPublicacion(publicacionDemostracionMomentaneo);
      setCargando(false);
      return;
    }

    if (!accessToken) {
      setPublicacion(null);
      setCargando(false);
      setError({ mensaje: 'Tu sesión no está disponible. Inicia sesión nuevamente.', reintentable: false });
      return;
    }

    try {
      setPublicacion(await obtenerPublicacion(id, accessToken));
    } catch (causa: unknown) {
      setError(clasificarErrorDetallePublicacion(causa));
    } finally {
      setCargando(false);
    }
  }, [accessToken, id]);

  useFocusEffect(
    useCallback(() => {
      void cargarPublicacion();
    }, [cargarPublicacion]),
  );

  const esPropietario = publicacion?.rolEnPublicacion === 'vendedor';
  const estaEnCurso = publicacion?.estado.descripcion === 'En curso';
  const estaVendida = publicacion?.estado.descripcion === 'Vendido';

  const nombreVendedor = publicacion?.vendedor
    ? [publicacion.vendedor.primerNombre, publicacion.vendedor.primerApellido]
        .filter(Boolean)
        .join(' ')
    : 'la persona vendedora';

  const abrirConfirmacionEliminacion = () => {
    setErrorEliminacion(undefined);
    setModalEliminarAbierto(true);
  };

  const confirmarEliminacion = async () => {
    if (!id || !accessToken || eliminando) return;

    setEliminando(true);
    setErrorEliminacion(undefined);

    try {
      await eliminarPublicacion(id, accessToken);
      setModalEliminarAbierto(false);
      router.replace('/inicio');
    } catch (causa: unknown) {
      setErrorEliminacion(
        causa instanceof ApiError ? causa.message : 'No pudimos eliminar la publicación. Reintenta más tarde.',
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Encabezado />

      {cargando ? (
        <EstadoPantalla icono="package-variant-closed" titulo="Cargando publicación…" />
      ) : error || !publicacion ? (
        <EstadoPantalla
          icono="package-variant-closed-remove"
          titulo={error?.mensaje ?? 'Publicación no encontrada'}
          texto={error?.reintentable ? 'Comprueba tu conexión e inténtalo nuevamente.' : 'Puede que ya no esté disponible o que el enlace no sea válido.'}
          accion={error?.reintentable ? () => void cargarPublicacion() : undefined}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.contenido}
          showsVerticalScrollIndicator={false}>
          <GaleriaProducto imagenes={publicacion.imagenes} />

          {estaVendida ? (
            <View style={styles.ventaFinalizada}>
              <View style={styles.ventaFinalizadaIcono}>
                <MaterialCommunityIcons name="check-decagram" size={26} color={colors.navy} />
              </View>
              <View style={styles.ventaFinalizadaContenido}>
                <Text style={styles.ventaFinalizadaTitulo}>
                  {publicacion.rolEnPublicacion === 'comprador'
                    ? '¡Compra finalizada!'
                    : '¡Venta finalizada!'}
                </Text>
                <Text style={styles.ventaFinalizadaTexto}>
                  {publicacion.rolEnPublicacion === 'comprador'
                    ? 'Esta publicación forma parte de tus compras.'
                    : 'Esta publicación está marcada como vendida.'}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.etiquetas}>
            <View style={styles.etiquetaCategoria}>
              <Text style={styles.etiquetaCategoriaTexto}>
                {publicacion.categoria.nombre}
              </Text>
            </View>
            {!estaEnCurso ? (
              <View style={estaVendida ? styles.etiquetaVendida : styles.etiquetaCategoria}>
                {estaVendida ? (
                  <MaterialCommunityIcons name="check-circle" size={13} color={colors.navy} />
                ) : null}
                <Text style={estaVendida ? styles.etiquetaVendidaTexto : styles.etiquetaCategoriaTexto}>
                  {estaVendida
                    ? publicacion.rolEnPublicacion === 'comprador'
                      ? 'Comprada'
                      : 'Vendida'
                    : publicacion.estado.descripcion}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tituloFila}>
            <Text style={styles.titulo}>{publicacion.titulo}</Text>
            {estaEnCurso && !esPropietario ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  errorFavorito ? 'No se pudo consultar favoritos. Reintentar' :
                    cargandoFavorito ? 'Consultando favorito' :
                      esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'
                }
                accessibilityState={{
                  disabled: cargandoFavorito || actualizandoFavorito,
                  busy: cargandoFavorito || actualizandoFavorito,
                  ...(errorFavorito || cargandoFavorito ? {} : { selected: esFavorito }),
                }}
                disabled={cargandoFavorito || actualizandoFavorito}
                onPress={() => errorFavorito ? reintentarFavorito() : void alternarFavorito()}
                style={styles.botonFavorito}>
                {cargandoFavorito ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <MaterialCommunityIcons
                    name={errorFavorito ? 'alert-circle-outline' : esFavorito ? 'heart' : 'heart-outline'}
                    size={23}
                    color={errorFavorito || esFavorito ? colors.error : colors.navy}
                  />
                )}
              </Pressable>
            ) : null}
          </View>
          {errorFavorito && estaEnCurso && !esPropietario ? (
            <Text accessibilityRole="alert" style={styles.estadoListaError}>
              No pudimos consultar tus favoritos. Presiona el icono para reintentar.
            </Text>
          ) : null}
          <Text style={styles.precio}>{precioClp(publicacion.precio)}</Text>

          <View style={styles.meta}>
            <Text style={styles.metaTexto}>{publicacion.tipoVenta.nombre}</Text>
            <Text style={styles.metaSeparador}>|</Text>
            <Text style={styles.metaTexto}>Sede {publicacion.sede.nombre}</Text>
          </View>

          <Text style={styles.seccionTitulo}>Descripción</Text>
          <Text style={styles.descripcion}>{publicacion.descripcion}</Text>

          <View style={styles.detalles}>
            <Text style={styles.detallesTitulo}>Detalles de la publicación</Text>
            <View style={styles.detallesGrilla}>
              <Detalle etiqueta="Categoría" valor={publicacion.categoria.nombre} />
              <Detalle etiqueta="Tipo de venta" valor={publicacion.tipoVenta.nombre} />
              <Detalle etiqueta="Sede" valor={publicacion.sede.nombre} />
              {!esPropietario && publicacion.vendedor ? (
                <Detalle
                  etiqueta="Vendido por"
                  valor={nombreVendedor}
                />
              ) : null}
            </View>
          </View>

          {esPropietario && accessToken ? (
            <ConsentimientoRecomendaciones
              key={publicacion.id}
              id={publicacion.id}
              titulo={publicacion.titulo}
              descripcion={publicacion.descripcion}
              accessToken={accessToken}
            />
          ) : null}

          {estaVendida ? null : esPropietario ? (
            <View style={styles.accionesPropietario}>
              <Text style={styles.accionTitulo}>Gestiona tu publicación</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/producto/editar/[id]', params: { id: publicacion.id } })
                }
                style={({ pressed }) => [styles.botonEditar, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.navy} />
                <Text style={styles.botonEditarTexto}>Editar publicación</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: eliminando, busy: eliminando }}
                disabled={eliminando}
                onPress={abrirConfirmacionEliminacion}
                style={({ pressed }) => [
                  styles.botonEliminar,
                  eliminando && styles.deshabilitado,
                  pressed && styles.pressed,
                ]}>
                {eliminando ? (
                  <ActivityIndicator color={colors.error} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                    <Text style={styles.botonEliminarTexto}>Eliminar publicación</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : estaEnCurso ? (
            <>
              <View style={styles.accion}>
                <Text style={styles.accionTitulo}>¿Te interesa esta publicación?</Text>
                <Text style={styles.accionTexto}>
                  Contacta a la persona vendedora para coordinar el intercambio.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enviar mensaje a la persona vendedora"
                  onPress={() =>
                    router.push({
                      pathname: '/chat/nuevo',
                      params: {
                        publicacionId: publicacion.id,
                        titulo: publicacion.titulo,
                        vendedorNombre: nombreVendedor,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.botonChat,
                    pressed && styles.pressed,
                  ]}>
                  <>
                    <MaterialCommunityIcons
                      name="message-text-outline"
                      size={18}
                      color={colors.navy}
                    />
                    <Text style={styles.botonChatTexto}>Enviar mensaje</Text>
                  </>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reportar publicación"
                onPress={() =>
                  router.push({
                    pathname: '/reporte/publicacion/[id]',
                    params: { id: publicacion.id },
                  })
                }
                style={({ pressed }) => [styles.botonReportar, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="flag-outline" size={18} color={colors.error} />
                <Text style={styles.botonReportarTexto}>Reportar publicación</Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={modalEliminarAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => !eliminando && setModalEliminarAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalEliminar}>
            <View style={styles.iconoEliminar}>
              <MaterialCommunityIcons name="trash-can-outline" size={32} color={colors.error} />
            </View>
            <Text style={styles.modalTitulo}>¿Eliminar publicación?</Text>
            <Text style={styles.modalTexto}>
              Eliminarás {'"'}{publicacion?.titulo ?? 'esta publicación'}{'"'} y sus imágenes. Esta acción no se puede deshacer.
            </Text>
            {errorEliminacion ? (
              <Text accessibilityRole="alert" style={styles.modalError}>
                {errorEliminacion}
              </Text>
            ) : null}
            <View style={styles.accionesModalEliminar}>
              <Pressable
                accessibilityRole="button"
                disabled={eliminando}
                onPress={() => setModalEliminarAbierto(false)}
                style={styles.botonCancelarModal}>
                <Text style={styles.botonCancelarModalTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: eliminando, disabled: eliminando }}
                disabled={eliminando}
                onPress={() => void confirmarEliminacion()}
                style={[styles.botonConfirmarEliminar, eliminando && styles.deshabilitado]}>
                {eliminando ? (
                  <ActivityIndicator color={colors.card} size="small" />
                ) : (
                  <Text style={styles.botonConfirmarEliminarTexto}>Eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Detalle({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.detalleItem}>
      <Text style={styles.detalleEtiqueta}>{etiqueta}</Text>
      <Text style={styles.detalleValor}>{valor}</Text>
    </View>
  );
}

function EstadoPantalla({
  icono,
  titulo,
  texto,
  accion,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  titulo: string;
  texto?: string;
  accion?: () => void;
}) {
  return (
    <View style={styles.vacio}>
      <View style={styles.vacioIcono}>
        <MaterialCommunityIcons name={icono} size={26} color={colors.gold} />
      </View>
      <Text style={styles.vacioTitulo}>{titulo}</Text>
      {texto ? <Text style={styles.vacioTexto}>{texto}</Text> : null}

      {accion ? (
        <Pressable
          accessibilityRole="button"
          onPress={accion}
          style={({ pressed }) => [styles.vacioBoton, pressed && styles.pressed]}>
          <Text style={styles.vacioBotonTexto}>Reintentar</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/inicio')}
          style={({ pressed }) => [styles.vacioBoton, pressed && styles.pressed]}>
          <Text style={styles.vacioBotonTexto}>Volver al inicio</Text>
        </Pressable>
      )}
    </View>
  );
}

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
        <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
      </Pressable>
      <Text style={styles.barraTitulo} numberOfLines={1}>
        Detalle del producto
      </Text>
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
    gap: spacing.padSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
  },
  volver: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  barraTitulo: { color: colors.navy, flexShrink: 1, fontSize: 16, fontWeight: '800' },
  contenido: {
    gap: spacing.padMd,
    paddingBottom: spacing.padLg,
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padMd,
  },
  ventaFinalizada: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: spacing.radiusLg,
    flexDirection: 'row',
    gap: spacing.padSm,
    padding: spacing.padMd,
  },
  ventaFinalizadaIcono: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  ventaFinalizadaContenido: { flex: 1, gap: 3 },
  ventaFinalizadaTitulo: { color: colors.card, fontSize: 16, fontWeight: '800' },
  ventaFinalizadaTexto: { color: colors.card, fontSize: 13, lineHeight: 18 },
  etiquetas: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  etiquetaVendida: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etiquetaVendidaTexto: { color: colors.navy, fontSize: 11, fontWeight: '700' },
  etiquetaCategoria: {
    backgroundColor: colors.navy,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etiquetaCategoriaTexto: { color: colors.card, fontSize: 11, fontWeight: '600' },
  tituloFila: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.padSm },
  titulo: { color: colors.navy, flex: 1, fontSize: 20, fontWeight: '800', lineHeight: 26 },
  botonFavorito: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  estadoListaError: { color: colors.error, fontSize: 13 },
  precio: { color: colors.navy, fontSize: 24, fontWeight: '900', marginTop: -8 },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8,
  },
  metaTexto: { color: colors.muted, fontSize: 13 },
  metaSeparador: { color: colors.muted, fontSize: 13 },
  seccionTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  descripcion: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: -8 },
  detalles: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    padding: spacing.padMd,
  },
  detallesTitulo: { color: colors.navy, fontSize: 14, fontWeight: '700', marginBottom: spacing.padSm },
  detallesGrilla: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  detalleItem: { gap: 2, width: '50%' },
  detalleEtiqueta: { color: colors.muted, fontSize: 12 },
  detalleValor: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  accion: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusLg,
    gap: 4,
    padding: spacing.padMd,
  },
  accionTitulo: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  accionTexto: { color: colors.navy, fontSize: 13, lineHeight: 18 },
  botonChat: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.navy,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: spacing.padSm,
    minHeight: spacing.touchMin,
  },
  botonChatTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  accionesPropietario: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    padding: spacing.padMd,
  },
  botonEditar: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonEditarTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  botonEliminar: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonEliminarTexto: { color: colors.error, fontSize: 14, fontWeight: '700' },
  deshabilitado: { opacity: 0.7 },
  botonReportar: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
  },
  botonReportarTexto: { color: colors.error, fontSize: 13, fontWeight: '700' },
  vacio: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
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
  vacioTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  vacioTexto: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  vacioBoton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    marginTop: spacing.padLg,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  vacioBotonTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,43,73,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  modalEliminar: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    maxWidth: 380,
    padding: spacing.padLg,
    width: '100%',
  },
  iconoEliminar: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  modalTitulo: { color: colors.navy, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  modalTexto: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  modalError: { alignSelf: 'stretch', color: colors.error, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  accionesModalEliminar: { flexDirection: 'row', gap: spacing.padSm, marginTop: spacing.padSm, width: '100%' },
  botonCancelarModal: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonCancelarModalTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  botonConfirmarEliminar: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: spacing.radiusMd,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonConfirmarEliminarTexto: { color: colors.card, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.9 },
});
