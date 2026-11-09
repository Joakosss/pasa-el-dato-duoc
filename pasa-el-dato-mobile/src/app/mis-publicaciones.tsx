import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PublicacionCard } from '@/components/feed/PublicacionCard';
import { ApiError } from '@/lib/api';
import {
  cambiarEstadoPublicacion,
  listarMisPublicaciones,
  type EstadoPublicacionAsignable,
  type PublicacionPublica,
} from '@/lib/api/publicaciones';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

interface FilaGrilla {
  clave: string;
  publicacion: PublicacionPublica | null;
}

export default function MisPublicacionesScreen() {
  const accessToken = useSesionStore(selectAccessToken);
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const [publicaciones, setPublicaciones] = useState<PublicacionPublica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState<string | null>(null);
  const [cambioPendiente, setCambioPendiente] = useState<{
    publicacion: PublicacionPublica;
    estado: EstadoPublicacionAsignable;
  } | null>(null);
  const [resultadoCambio, setResultadoCambio] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const cargarPublicaciones = useCallback(async (esActualizacion = false) => {
    if (!accessToken) {
      setError('Tu sesión no está disponible. Inicia sesión nuevamente.');
      setCargando(false);
      return;
    }

    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError(undefined);
    try {
      setPublicaciones(await listarMisPublicaciones(accessToken));
    } catch (causa: unknown) {
      if (causa instanceof ApiError && causa.status === 401) {
        cerrarSesion();
        router.replace('/auth/login');
        return;
      }

      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos cargar tus publicaciones. Reintenta.',
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [accessToken, cerrarSesion]);

  useFocusEffect(
    useCallback(() => {
      void cargarPublicaciones();
    }, [cargarPublicaciones]),
  );

  const confirmarCambioEstado = (
    publicacion: PublicacionPublica,
    estado: EstadoPublicacionAsignable,
  ) => {
    if (!accessToken || cambiandoEstadoId) return;
    setCambioPendiente({ publicacion, estado });
  };

  const aplicarCambioEstado = async () => {
    if (!accessToken || !cambioPendiente) return;

    const { publicacion, estado } = cambioPendiente;
    setCambiandoEstadoId(publicacion.id);

    try {
      await cambiarEstadoPublicacion(publicacion.id, estado, accessToken);
      setCambioPendiente(null);
      setResultadoCambio(
        `"${publicacion.titulo}" ahora está ${estado.toLowerCase()}.`,
      );
      await cargarPublicaciones(true);
    } catch (causa: unknown) {
      setCambioPendiente(null);
      setResultadoCambio(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos cambiar el estado. Reintenta más tarde.',
      );
    } finally {
      setCambiandoEstadoId(null);
    }
  };

  const filas = useMemo(() => {
    const items: FilaGrilla[] = publicaciones.map((publicacion) => ({
      clave: publicacion.id,
      publicacion,
    }));

    if (items.length % 2 === 1) items.push({ clave: 'relleno', publicacion: null });
    return items;
  }, [publicaciones]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al perfil"
          onPress={() => router.replace('/perfil')}
          style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
        </Pressable>
        <View style={styles.barraTexto}>
          <Text style={styles.titulo}>Mis publicaciones</Text>
          <Text style={styles.subtitulo}>
            {publicaciones.length}{' '}
            {publicaciones.length === 1 ? 'publicación activa' : 'publicaciones activas'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear publicación"
          onPress={() =>
            router.push({
              pathname: '/publicar',
              params: { origen: 'mis-publicaciones' },
            })
          }
          style={styles.botonPublicar}>
          <MaterialCommunityIcons name="plus" size={21} color={colors.navy} />
        </Pressable>
      </View>

      <FlatList
        data={filas}
        keyExtractor={(fila) => fila.clave}
        renderItem={({ item }) => (
          <View style={styles.celda}>
            {item.publicacion ? (
              <>
                <PublicacionCard publicacion={item.publicacion} />
                <AccionesEstado
                  publicacion={item.publicacion}
                  cambiando={cambiandoEstadoId === item.publicacion.id}
                  onCambiar={confirmarCambioEstado}
                />
              </>
            ) : null}
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.fila}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => void cargarPublicaciones(true)}
            tintColor={colors.navy}
          />
        }
        ListHeaderComponent={
          !cargando && !error && publicaciones.length > 0 ? (
            <View style={styles.aviso}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.navy} />
              <Text style={styles.avisoTexto}>
                Abre una publicación para editarla o eliminarla.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          cargando ? (
            <Estado icono="package-variant-closed" titulo="Cargando tus publicaciones…" />
          ) : error ? (
            <Estado
              icono="alert-circle-outline"
              titulo={error}
              esError
              accion={() => void cargarPublicaciones()}
              textoAccion="Reintentar"
            />
          ) : (
            <Estado
              icono="storefront-outline"
              titulo="Aún no tienes publicaciones"
              mensaje="Crea tu primera publicación y aparecerá aquí para que puedas gestionarla."
              accion={() =>
                router.push({
                  pathname: '/publicar',
                  params: { origen: 'mis-publicaciones' },
                })
              }
              textoAccion="Crear publicación"
            />
          )
        }
      />

      <Modal
        visible={cambioPendiente !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !cambiandoEstadoId && setCambioPendiente(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalEstado}>
            <View style={styles.iconoModalEstado}>
              <MaterialCommunityIcons
                name={
                  cambioPendiente?.estado === 'Vendido'
                    ? 'tag-check-outline'
                    : 'pause-circle-outline'
                }
                size={30}
                color={colors.gold}
              />
            </View>
            <Text style={styles.modalEstadoTitulo}>
              {cambioPendiente?.estado === 'Vendido'
                ? 'Marcar como vendida'
                : `Cambiar a ${cambioPendiente?.estado.toLowerCase()}`}
            </Text>
            <Text style={styles.modalEstadoTexto}>
              La publicación "{cambioPendiente?.publicacion.titulo}" quedará{' '}
              {cambioPendiente?.estado.toLowerCase()}.
            </Text>
            <View style={styles.accionesModalEstado}>
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(cambiandoEstadoId)}
                onPress={() => setCambioPendiente(null)}
                style={styles.botonCancelarEstado}>
                <Text style={styles.botonCancelarEstadoTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: Boolean(cambiandoEstadoId) }}
                disabled={Boolean(cambiandoEstadoId)}
                onPress={() => void aplicarCambioEstado()}
                style={[styles.botonConfirmarEstado, cambiandoEstadoId && styles.deshabilitado]}>
                {cambiandoEstadoId ? (
                  <ActivityIndicator color={colors.navy} size="small" />
                ) : (
                  <Text style={styles.botonConfirmarEstadoTexto}>Confirmar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={resultadoCambio !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setResultadoCambio(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalEstado}>
            <View style={styles.iconoModalEstado}>
              <MaterialCommunityIcons name="check-circle-outline" size={30} color={colors.gold} />
            </View>
            <Text style={styles.modalEstadoTitulo}>
              {resultadoCambio?.startsWith('No pudimos') ||
              resultadoCambio?.startsWith('Estado inválido')
                ? 'No se pudo cambiar el estado'
                : 'Estado actualizado'}
            </Text>
            <Text style={styles.modalEstadoTexto}>{resultadoCambio}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setResultadoCambio(null)}
              style={styles.botonConfirmarEstado}>
              <Text style={styles.botonConfirmarEstadoTexto}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AccionesEstado({
  publicacion,
  cambiando,
  onCambiar,
}: {
  publicacion: PublicacionPublica;
  cambiando: boolean;
  onCambiar: (
    publicacion: PublicacionPublica,
    estado: EstadoPublicacionAsignable,
  ) => void;
}) {
  const estado = publicacion.estado?.descripcion ?? 'En curso';
  const siguiente: EstadoPublicacionAsignable =
    estado === 'En curso' ? 'Pausado' : 'En curso';
  const etiqueta =
    estado === 'En curso' ? 'Pausar' : 'Reactivar';

  return (
    <View style={styles.accionesEstado}>
      <Text style={styles.estadoPublicacion}>Estado: {estado}</Text>
      <View style={styles.botonesEstado}>
        <Pressable
          accessibilityRole="button"
          disabled={cambiando}
          onPress={() => onCambiar(publicacion, siguiente)}
          style={[styles.botonEstadoSecundario, cambiando && styles.deshabilitado]}>
          <Text style={styles.botonEstadoSecundarioTexto}>{etiqueta}</Text>
        </Pressable>
        {estado !== 'Vendido' ? (
          <Pressable
            accessibilityRole="button"
            disabled={cambiando}
            onPress={() => onCambiar(publicacion, 'Vendido')}
            style={[styles.botonEstadoVendido, cambiando && styles.deshabilitado]}>
            <Text style={styles.botonEstadoVendidoTexto}>Vendida</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Estado({
  icono,
  titulo,
  mensaje,
  esError = false,
  accion,
  textoAccion,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  titulo: string;
  mensaje?: string;
  esError?: boolean;
  accion?: () => void;
  textoAccion?: string;
}) {
  return (
    <View style={styles.estado}>
      <View style={styles.iconoEstado}>
        <MaterialCommunityIcons
          name={icono}
          size={30}
          color={esError ? colors.error : colors.gold}
        />
      </View>
      <Text style={[styles.estadoTitulo, esError && styles.estadoError]}>{titulo}</Text>
      {mensaje ? <Text style={styles.estadoMensaje}>{mensaje}</Text> : null}
      {accion && textoAccion ? (
        <Pressable accessibilityRole="button" onPress={accion} style={styles.botonEstado}>
          <Text style={styles.botonEstadoTexto}>{textoAccion}</Text>
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
    gap: spacing.padSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
  },
  volver: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  barraTexto: { flex: 1 },
  titulo: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  subtitulo: { color: colors.muted, fontSize: 12, marginTop: 1 },
  botonPublicar: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  contenido: { gap: spacing.padMd, padding: spacing.padMd },
  fila: { gap: spacing.padSm },
  celda: { flex: 1, gap: 6 },
  accionesEstado: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    gap: 6,
    padding: 8,
  },
  estadoPublicacion: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  botonesEstado: { flexDirection: 'row', gap: 6 },
  botonEstadoSecundario: {
    alignItems: 'center',
    borderColor: colors.navy,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flex: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  botonEstadoSecundarioTexto: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  botonEstadoVendido: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusSm,
    flex: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  botonEstadoVendidoTexto: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  deshabilitado: { opacity: 0.55 },
  aviso: {
    alignItems: 'center',
    backgroundColor: '#fff8dc',
    borderColor: colors.gold,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.padSm,
  },
  avisoTexto: { color: colors.navy, flex: 1, fontSize: 12, lineHeight: 17 },
  estado: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    marginTop: spacing.padMd,
    padding: spacing.padLg,
  },
  iconoEstado: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  estadoTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  estadoError: { color: colors.error },
  estadoMensaje: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  botonEstado: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    marginTop: spacing.padSm,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  botonEstadoTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,43,73,0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  modalEstado: {
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
  iconoModalEstado: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  modalEstadoTitulo: { color: colors.navy, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalEstadoTexto: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  accionesModalEstado: { flexDirection: 'row', gap: spacing.padSm, marginTop: spacing.padSm, width: '100%' },
  botonCancelarEstado: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonCancelarEstadoTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  botonConfirmarEstado: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  botonConfirmarEstadoTexto: { color: colors.navy, fontSize: 14, fontWeight: '800' },
});
