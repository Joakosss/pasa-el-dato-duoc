import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  actualizarPreferenciasNotificaciones,
  listarNotificaciones,
  marcarNotificacionComoLeida,
  obtenerPreferenciasNotificaciones,
  type NotificacionUsuario,
} from '@/lib/api/notificaciones';
import { ApiError } from '@/lib/api';
import { listarConversaciones } from '@/lib/chat/chat-api';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

const CONFIGURACION_TIPO = {
  CHAT_NUEVO_MENSAJE: {
    icono: 'message-text-outline',
    titulo: 'Nuevo mensaje',
  },
  FAVORITA_VENDIDA: {
    icono: 'heart-outline',
    titulo: 'Favorito vendido',
  },
  REPORTE_RESULTADO: {
    icono: 'file-check-outline',
    titulo: 'Resultado de reporte',
  },
  ADMIN_ADVERTENCIA: {
    icono: 'alert-outline',
    titulo: 'Advertencia',
  },
  ADMIN_AVISO: {
    icono: 'bell-outline',
    titulo: 'Aviso administrativo',
  },
} as const;

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  return fecha.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function obtenerConversacionId(
  dataJson: Record<string, unknown> | null,
): string | null {
  const valor = dataJson?.conversacionId;
  return typeof valor === 'string' && valor ? valor : null;
}

export default function NotificacionesScreen() {
  const accessToken = useSesionStore(selectAccessToken);
  const [notificaciones, setNotificaciones] = useState<NotificacionUsuario[]>([]);
  const [pushHabilitado, setPushHabilitado] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [actualizandoPreferencia, setActualizandoPreferencia] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const noLeidas = useMemo(
    () => notificaciones.filter((notificacion) => !notificacion.leida).length,
    [notificaciones],
  );

  const cargar = useCallback(async (esActualizacion = false) => {
    if (!accessToken) {
      setError('Tu sesión no está disponible. Inicia sesión nuevamente.');
      setCargando(false);
      return;
    }

    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError(undefined);
    try {
      const [historial, preferencias] = await Promise.all([
        listarNotificaciones(accessToken),
        obtenerPreferenciasNotificaciones(accessToken),
      ]);
      setNotificaciones(historial.items);
      setPushHabilitado(preferencias.pushHabilitado);
    } catch (causa: unknown) {
      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos cargar tus notificaciones. Reintenta.',
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const abrirNotificacion = async (notificacion: NotificacionUsuario) => {
    if (!accessToken) return;

    if (!notificacion.leida) {
      try {
        const actualizada = await marcarNotificacionComoLeida(
          notificacion.id,
          accessToken,
        );
        setNotificaciones((actuales) =>
          actuales.map((item) =>
            item.id === actualizada.id ? actualizada : item,
          ),
        );
      } catch {
        // La navegación no debe bloquearse si la lectura falla por red.
      }
    }

    const conversacionId = obtenerConversacionId(notificacion.dataJson);
    if (notificacion.tipo === 'CHAT_NUEVO_MENSAJE' && conversacionId) {
      try {
        const conversaciones = await listarConversaciones(accessToken);
        const conversacion = conversaciones.items.find(
          (item) => item.conversacionId === conversacionId,
        );

        router.push({
          pathname: '/chat/[id]',
          params: conversacion
            ? {
                id: conversacion.conversacionId,
                titulo:
                  conversacion.publicacion.titulo ??
                  'Publicación no disponible',
                contraparteNombre: conversacion.contraparte.primerNombre,
                contraparteCuentaId: conversacion.contraparteCuentaId,
                contraparteEnLinea: String(
                  conversacion.contraparte.enLinea,
                ),
                publicacionId: conversacion.publicacionId,
                rolEnTransaccion: conversacion.rolEnTransaccion,
              }
            : {
                id: conversacionId,
                publicacionId:
                  typeof notificacion.dataJson?.publicacionId === 'string'
                    ? notificacion.dataJson.publicacionId
                    : undefined,
              },
        });
      } catch {
        router.push({
          pathname: '/chat/[id]',
          params: { id: conversacionId },
        });
      }
    }
  };

  const alternarPreferencia = async () => {
    if (!accessToken || actualizandoPreferencia) return;

    const siguiente = !pushHabilitado;
    setActualizandoPreferencia(true);
    try {
      const respuesta = await actualizarPreferenciasNotificaciones(
        siguiente,
        accessToken,
      );
      setPushHabilitado(respuesta.pushHabilitado);
    } catch (causa: unknown) {
      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos actualizar tus preferencias.',
      );
    } finally {
      setActualizandoPreferencia(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={23} color={colors.navy} />
        </Pressable>
        <View style={styles.barraTexto}>
          <Text style={styles.titulo}>Notificaciones</Text>
          <Text style={styles.subtitulo}>
            {noLeidas ? `${noLeidas} sin leer` : 'Todo al día'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => void cargar(true)}
            tintColor={colors.navy}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.preferencias}>
          <View style={styles.preferenciasTexto}>
            <Text style={styles.preferenciasTitulo}>Notificaciones in-app</Text>
            <Text style={styles.preferenciasDescripcion}>
              Recibe avisos en tu bandeja cuando haya novedades.
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{
              checked: pushHabilitado,
              busy: actualizandoPreferencia,
            }}
            disabled={actualizandoPreferencia}
            onPress={() => void alternarPreferencia()}
            style={[
              styles.interruptor,
              pushHabilitado && styles.interruptorActivo,
              actualizandoPreferencia && styles.deshabilitado,
            ]}>
            <View
              style={[
                styles.interruptorCirculo,
                pushHabilitado && styles.interruptorCirculoActivo,
              ]}
            />
          </Pressable>
        </View>

        {cargando ? (
          <Estado icono="bell-outline" titulo="Cargando notificaciones…" cargando />
        ) : error ? (
          <Estado
            icono="alert-circle-outline"
            titulo={error}
            esError
            accion={() => void cargar()}
            textoAccion="Reintentar"
          />
        ) : notificaciones.length === 0 ? (
          <Estado
            icono="bell-check-outline"
            titulo="No tienes notificaciones"
            mensaje="Cuando haya novedades sobre tus chats, favoritos o reportes, aparecerán aquí."
          />
        ) : (
          <View style={styles.lista}>
            {notificaciones.map((notificacion) => {
              const configuracion = CONFIGURACION_TIPO[notificacion.tipo];
              return (
                <Pressable
                  key={notificacion.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${configuracion.titulo}: ${notificacion.mensaje}`}
                  onPress={() => void abrirNotificacion(notificacion)}
                  style={[
                    styles.notificacion,
                    !notificacion.leida && styles.notificacionNoLeida,
                  ]}>
                  <View style={styles.iconoNotificacion}>
                    <MaterialCommunityIcons
                      name={configuracion.icono}
                      size={22}
                      color={colors.gold}
                    />
                  </View>
                  <View style={styles.notificacionContenido}>
                    <View style={styles.notificacionEncabezado}>
                      <Text style={styles.notificacionTipo}>
                        {configuracion.titulo}
                      </Text>
                      {!notificacion.leida ? <View style={styles.puntoNoLeido} /> : null}
                    </View>
                    <Text style={styles.notificacionMensaje}>
                      {notificacion.mensaje}
                    </Text>
                    <Text style={styles.notificacionFecha}>
                      {formatearFecha(notificacion.fechaCreacion)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.avisoPush}>
          Los avisos aparecen dentro de la aplicación. Las notificaciones del
          sistema con la app cerrada requieren habilitar push en una siguiente fase.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Estado({
  icono,
  titulo,
  mensaje,
  esError = false,
  cargando = false,
  accion,
  textoAccion,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  titulo: string;
  mensaje?: string;
  esError?: boolean;
  cargando?: boolean;
  accion?: () => void;
  textoAccion?: string;
}) {
  return (
    <View style={styles.estado}>
      <View style={styles.iconoEstado}>
        {cargando ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          <MaterialCommunityIcons
            name={icono}
            size={29}
            color={esError ? colors.error : colors.gold}
          />
        )}
      </View>
      <Text style={[styles.estadoTitulo, esError && styles.estadoError]}>
        {titulo}
      </Text>
      {mensaje ? <Text style={styles.estadoMensaje}>{mensaje}</Text> : null}
      {accion && textoAccion ? (
        <Pressable
          accessibilityRole="button"
          onPress={accion}
          style={styles.botonReintentar}>
          <Text style={styles.botonReintentarTexto}>{textoAccion}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.surface, flex: 1 },
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
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  barraTexto: { flex: 1 },
  titulo: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  subtitulo: { color: colors.muted, fontSize: 12, marginTop: 1 },
  contenido: { gap: spacing.padMd, padding: spacing.padMd },
  preferencias: {
    alignItems: 'center',
    backgroundColor: '#fff8dc',
    borderColor: colors.gold,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.padSm,
    padding: spacing.padMd,
  },
  preferenciasTexto: { flex: 1 },
  preferenciasTitulo: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  preferenciasDescripcion: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  interruptor: {
    backgroundColor: colors.border,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 54,
  },
  interruptorActivo: { backgroundColor: colors.navy },
  interruptorCirculo: {
    backgroundColor: colors.card,
    borderRadius: 13,
    height: 26,
    width: 26,
  },
  interruptorCirculoActivo: { alignSelf: 'flex-end' },
  lista: { gap: spacing.padSm },
  notificacion: {
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.padSm,
    padding: spacing.padSm,
  },
  notificacionNoLeida: { borderColor: colors.gold },
  iconoNotificacion: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  notificacionContenido: { flex: 1, gap: 3 },
  notificacionEncabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificacionTipo: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  puntoNoLeido: { backgroundColor: colors.error, borderRadius: 5, height: 10, width: 10 },
  notificacionMensaje: { color: colors.navy, fontSize: 13, lineHeight: 18 },
  notificacionFecha: { color: colors.muted, fontSize: 11 },
  estado: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    padding: spacing.padLg,
  },
  iconoEstado: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  estadoTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  estadoError: { color: colors.error },
  estadoMensaje: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  botonReintentar: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
  },
  botonReintentarTexto: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  avisoPush: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  deshabilitado: { opacity: 0.6 },
});
