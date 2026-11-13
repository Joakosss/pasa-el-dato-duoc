import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EstrellasMomentaneo } from '@/components/ui/EstrellasMomentaneo';
import {
  activarCalificacionPublicacion,
  cerrarVentaPublicacion,
  crearCalificacion,
  obtenerTransaccionPublicacion,
} from '@/lib/api/publicaciones';
import {
  enviarMensaje as enviarMensajeApi,
  listarMensajes,
  marcarConversacionLeida,
  type MensajeChat,
} from '@/lib/chat/chat-api';
import {
  crearSocketChat,
  type SocketChat,
} from '@/lib/chat/chat-socket';
import {
  useEvaluacionesMomentaneoStore,
  type RolEvaluacionMomentaneo,
} from '@/stores/evaluaciones-momentaneo-store';
import { selectAccessToken, selectSesion, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

function hora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  return fecha.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function agregarMensajeSinDuplicados(
  actuales: MensajeChat[],
  mensaje: MensajeChat,
): MensajeChat[] {
  if (actuales.some((item) => item.id === mensaje.id)) return actuales;
  return [...actuales, mensaje].sort(
    (a, b) => new Date(a.enviadoEn).getTime() - new Date(b.enviadoEn).getTime(),
  );
}

export default function ConversacionChatScreen() {
  const { id, titulo, contraparteNombre, contraparteCuentaId, contraparteEnLinea, publicacionId, rolEnTransaccion } = useLocalSearchParams<{
    id: string;
    titulo?: string;
    contraparteNombre?: string;
    contraparteCuentaId?: string;
    contraparteEnLinea?: string;
    publicacionId?: string;
    rolEnTransaccion?: RolEvaluacionMomentaneo;
  }>();
  const accessToken = useSesionStore(selectAccessToken);
  const sesion = useSesionStore(selectSesion);
  const [texto, setTexto] = useState('');
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [estaEnLinea, setEstaEnLinea] = useState(contraparteEnLinea === 'true');
  const [modalAccionesAbierto, setModalAccionesAbierto] = useState(false);
  const [modalConfirmarVentaAbierto, setModalConfirmarVentaAbierto] = useState(false);
  const [modalEvaluacionAbierto, setModalEvaluacionAbierto] = useState(false);
  const [cerrandoVenta, setCerrandoVenta] = useState(false);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [errorCierreVenta, setErrorCierreVenta] = useState<string | null>(null);
  const [errorCalificacion, setErrorCalificacion] = useState<string | null>(null);
  const [estrellasSeleccionadas, setEstrellasSeleccionadas] = useState(0);
  const [comentarioEvaluacion, setComentarioEvaluacion] = useState('');
  const publicacionesVendidasMomentaneo = useEvaluacionesMomentaneoStore(
    (estado) => estado.publicacionesVendidasMomentaneo,
  );
  const evaluacionesMomentaneo = useEvaluacionesMomentaneoStore(
    (estado) => estado.evaluacionesMomentaneo,
  );
  const marcarPublicacionVendidaMomentaneo = useEvaluacionesMomentaneoStore(
    (estado) => estado.marcarPublicacionVendidaMomentaneo,
  );
  const guardarEvaluacionMomentaneo = useEvaluacionesMomentaneoStore(
    (estado) => estado.guardarEvaluacionMomentaneo,
  );
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const socketRef = useRef<SocketChat | null>(null);

  const conversacionId = id ?? '';
  const tituloPublicacion = titulo ?? 'Conversación';
  const nombreContraparte = contraparteNombre ?? 'Usuario';
  // TODO[MOMENTANEO]: usar siempre publicacionId cuando el contrato mobile
  // esté disponible en conversaciones ya abiertas. El respaldo mantiene
  // visible el prototipo en chats cargados antes de la ampliación del contrato.
  const idPublicacion = publicacionId ?? conversacionId;
  const rolActualMomentaneo: RolEvaluacionMomentaneo =
    rolEnTransaccion === 'vendedor' ? 'vendedor' : 'comprador';
  const ventaConfirmadaMomentaneo =
    Boolean(idPublicacion) && publicacionesVendidasMomentaneo[idPublicacion] === true;
  const evaluacionPropiaMomentaneo = evaluacionesMomentaneo.find(
    (evaluacion) =>
      evaluacion.publicacionId === idPublicacion &&
      evaluacion.rol === rolActualMomentaneo,
  );

  const cargarHistorial = useCallback(async () => {
    if (!accessToken || !conversacionId) {
      setError('Inicia sesión para acceder a esta conversación.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const respuesta = await listarMensajes(accessToken, conversacionId);
      setMensajes([...respuesta.items].reverse());
      await marcarConversacionLeida(accessToken, conversacionId);
    } catch {
      setError('No pudimos cargar los mensajes. Revisa tu conexión e intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  }, [accessToken, conversacionId]);

  useEffect(() => {
    void Promise.resolve().then(cargarHistorial);
  }, [cargarHistorial]);

  useEffect(() => {
    if (!accessToken || !publicacionId) return;

    const sincronizarEstadoTransaccion = () => {
      void obtenerTransaccionPublicacion(publicacionId, accessToken)
        .then((transaccion) => {
          if (transaccion.calificacionActivada) {
            marcarPublicacionVendidaMomentaneo(publicacionId);
          }
        })
        .catch(() => {
          // La conversación puede existir antes de que la venta sea confirmada.
        });
    };

    sincronizarEstadoTransaccion();
    const intervalo = setInterval(sincronizarEstadoTransaccion, 5_000);

    return () => clearInterval(intervalo);
  }, [accessToken, marcarPublicacionVendidaMomentaneo, publicacionId]);

  useEffect(() => {
    if (!accessToken || !conversacionId) return;

    const socket = crearSocketChat(accessToken);
    socketRef.current = socket;

    const quitarListener = socket.alRecibirMensaje((mensaje) => {
      if (mensaje.conversacionId !== conversacionId) return;
      setMensajes((actuales) => agregarMensajeSinDuplicados(actuales, mensaje));
    });
    const quitarListenerPresencia = socket.alCambiarPresencia((presencia) => {
      if (presencia.cuentaId === contraparteCuentaId) {
        setEstaEnLinea(presencia.enLinea);
      }
    });

    void socket
      .conectar()
      .then(() => socket.unirseAConversacion(conversacionId))
      .then((respuesta) => {
        setMensajes(respuesta.items);
        return socket.marcarComoLeida(conversacionId);
      })
      .catch(() => {
        // El historial REST sigue disponible aunque falle el canal en tiempo real.
      });

    return () => {
      quitarListener();
      quitarListenerPresencia();
      socket.desconectar();
      socketRef.current = null;
    };
  }, [accessToken, conversacionId, contraparteCuentaId]);

  const abrirEvaluacion = () => {
    setEstrellasSeleccionadas(evaluacionPropiaMomentaneo?.estrellas ?? 0);
    setComentarioEvaluacion(evaluacionPropiaMomentaneo?.comentario ?? '');
    setErrorCalificacion(null);
    setModalEvaluacionAbierto(true);
  };

  const confirmarVentaReal = async () => {
    if (!accessToken || !publicacionId || !contraparteCuentaId || cerrandoVenta) {
      setErrorCierreVenta(
        'No pudimos identificar la publicación o al comprador para cerrar la venta.',
      );
      return;
    }

    setCerrandoVenta(true);
    setErrorCierreVenta(null);

    try {
      await cerrarVentaPublicacion(publicacionId, contraparteCuentaId, accessToken);
      await activarCalificacionPublicacion(publicacionId, accessToken);
      marcarPublicacionVendidaMomentaneo(publicacionId);
      setModalConfirmarVentaAbierto(false);
    } catch (causa: unknown) {
      setErrorCierreVenta(
        causa instanceof Error
          ? causa.message
          : 'No pudimos cerrar la venta. Inténtalo nuevamente.',
      );
    } finally {
      setCerrandoVenta(false);
    }
  };

  const guardarEvaluacion = async () => {
    if (!accessToken || !publicacionId || estrellasSeleccionadas < 1 || guardandoCalificacion) {
      return;
    }

    setGuardandoCalificacion(true);
    setErrorCalificacion(null);

    try {
      await crearCalificacion(
        publicacionId,
        {
          puntaje: estrellasSeleccionadas,
          comentario: comentarioEvaluacion.trim() || undefined,
        },
        accessToken,
      );
      guardarEvaluacionMomentaneo({
        publicacionId,
        rol: rolActualMomentaneo,
        estrellas: estrellasSeleccionadas,
        comentario: comentarioEvaluacion,
      });
      setModalEvaluacionAbierto(false);
    } catch (causa: unknown) {
      setErrorCalificacion(
        causa instanceof Error
          ? causa.message
          : 'No pudimos guardar tu calificación. Inténtalo nuevamente.',
      );
    } finally {
      setGuardandoCalificacion(false);
    }
  };

  const enviarMensaje = async () => {
    const contenido = texto.trim();
    if (!contenido || !accessToken || enviando) return;

    setEnviando(true);
    setError(null);

    try {
      const mensaje = await enviarMensajeApi(accessToken, conversacionId, contenido);
      setMensajes((actuales) => agregarMensajeSinDuplicados(actuales, mensaje));
      setTexto('');
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch {
      setError('No se pudo enviar el mensaje. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.barra}>
        <BotonVolver />
        <Avatar nombre={nombreContraparte} tamano={36} />
        <View style={styles.barraInformacion}>
          <Text style={styles.barraTitulo} numberOfLines={1}>
            {nombreContraparte}
          </Text>
          <View style={styles.filaPresencia}>
            <View
              accessibilityLabel={estaEnLinea ? 'Usuario en línea' : 'Usuario desconectado'}
              style={[
                styles.indicadorPresencia,
                estaEnLinea ? styles.indicadorPresenciaEnLinea : styles.indicadorPresenciaDesconectado,
              ]}
            />
            <Text style={styles.barraSubtitulo} numberOfLines={1}>
              {estaEnLinea ? 'En línea' : 'Desconectado'}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir acciones de la conversación"
        onPress={() => setModalAccionesAbierto(true)}
        style={({ pressed }) => [styles.producto, pressed && styles.productoPresionado]}>
        <MaterialCommunityIcons name="tag-outline" size={18} color={colors.gold} />
        <View style={styles.productoTexto}>
          <Text style={styles.productoEtiqueta}>Conversación por</Text>
          <Text style={styles.productoTitulo} numberOfLines={1}>
            {tituloPublicacion}
          </Text>
        </View>
        <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.gold} />
      </Pressable>

      {idPublicacion ? (
        <View style={styles.tarjetaCierreVenta}>
          <View style={styles.iconoCierreVenta}>
            <MaterialCommunityIcons
              name={ventaConfirmadaMomentaneo ? 'check-decagram-outline' : 'handshake-outline'}
              size={22}
              color={colors.gold}
            />
          </View>
          <View style={styles.cierreVentaTexto}>
            <Text style={styles.cierreVentaTitulo}>
              {ventaConfirmadaMomentaneo ? 'Venta confirmada' : '¿Concretaron la venta?'}
            </Text>
            <Text style={styles.cierreVentaDescripcion}>
              {ventaConfirmadaMomentaneo
                ? 'Ambas partes pueden evaluar esta experiencia.'
                : rolActualMomentaneo === 'vendedor'
                  ? `Usa el menú de la publicación para marcarla como vendida a ${nombreContraparte}.`
                  : 'El vendedor podrá confirmar la venta desde el menú de esta publicación.'}
            </Text>
          </View>
          {ventaConfirmadaMomentaneo ? (
            evaluacionPropiaMomentaneo ? (
              <View accessibilityLabel="Calificación enviada" style={styles.botonEvaluacionEnviada}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.navy} />
                <Text style={styles.botonEvaluarTexto}>Evaluación enviada</Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={abrirEvaluacion}
                style={styles.botonEvaluar}>
                <MaterialCommunityIcons name="star-outline" size={18} color={colors.navy} />
                <Text style={styles.botonEvaluarTexto}>Evaluar</Text>
              </Pressable>
            )
          ) : null}
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.mensajes}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}>
          <View style={styles.avisoSeguridad}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.navy} />
            <Text style={styles.avisoSeguridadTexto}>
              Mantén la conversación dentro de la app y evita compartir datos sensibles.
            </Text>
          </View>

          {cargando ? (
            <View style={styles.estado}>
              <ActivityIndicator color={colors.navy} />
              <Text style={styles.estadoTexto}>Cargando mensajes…</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorTexto}>{error}</Text>
              {!mensajes.length ? (
                <Pressable onPress={() => void cargarHistorial()} style={styles.reintentar}>
                  <Text style={styles.reintentarTexto}>Reintentar</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {!cargando && !error && !mensajes.length ? (
            <Text style={styles.sinMensajes}>Aún no hay mensajes. Inicia la conversación.</Text>
          ) : null}

          {mensajes.map((mensaje) => {
            const enviadoPorMi = mensaje.emisorCuentaId === sesion?.idCuenta;
            return (
              <View
                key={mensaje.id}
                style={[
                  styles.filaMensaje,
                  enviadoPorMi ? styles.filaPropia : styles.filaOtra,
                ]}>
                <View
                  style={[
                    styles.burbuja,
                    enviadoPorMi ? styles.burbujaPropia : styles.burbujaOtra,
                  ]}>
                  <Text
                    style={[
                      styles.textoMensaje,
                      enviadoPorMi ? styles.textoPropio : styles.textoOtro,
                    ]}>
                    {mensaje.texto}
                  </Text>
                  <View style={styles.metaMensaje}>
                    <Text
                      style={[
                        styles.hora,
                        enviadoPorMi ? styles.horaPropia : styles.horaOtra,
                      ]}>
                      {hora(mensaje.enviadoEn)}
                    </Text>
                    {enviadoPorMi && mensaje.leidoPorContraparte ? (
                      <MaterialCommunityIcons name="check-all" size={15} color={colors.gold} />
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.cajaTexto}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={() => void enviarMensaje()}
              blurOnSubmit={false}
              style={styles.input}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityState={{ disabled: !texto.trim() || enviando }}
            disabled={!texto.trim() || enviando}
            onPress={() => void enviarMensaje()}
            style={[
              styles.botonEnviar,
              (!texto.trim() || enviando) && styles.botonEnviarDeshabilitado,
            ]}>
            {enviando ? (
              <ActivityIndicator color={colors.navy} size="small" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={colors.navy} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalAccionesAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAccionesAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalAcciones}>
            <View style={styles.iconoModalEvaluacion}>
              <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={34} color={colors.gold} />
            </View>
            <Text style={styles.modalTituloEvaluacion}>Acciones de la conversación</Text>
            <Text style={styles.modalTextoEvaluacion}>{tituloPublicacion}</Text>

            {rolActualMomentaneo === 'vendedor' && !ventaConfirmadaMomentaneo ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setErrorCierreVenta(null);
                  setModalAccionesAbierto(false);
                  setModalConfirmarVentaAbierto(true);
                }}
                style={styles.accionMenuVender}>
                <MaterialCommunityIcons name="tag-check-outline" size={20} color={colors.navy} />
                <Text style={styles.accionMenuVenderTexto}>Marcar como vendido</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => setModalAccionesAbierto(false)}
              style={styles.accionMenuReportar}>
              <MaterialCommunityIcons name="flag-outline" size={20} color={colors.error} />
              <Text style={styles.accionMenuReportarTexto}>Reportar usuario</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setModalAccionesAbierto(false)}
              style={styles.botonCerrarAcciones}>
              <Text style={styles.botonCancelarEvaluacionTexto}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalConfirmarVentaAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalConfirmarVentaAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalAcciones}>
            <View style={styles.iconoModalEvaluacion}>
              <MaterialCommunityIcons name="tag-check-outline" size={34} color={colors.gold} />
            </View>
            <Text style={styles.modalTituloEvaluacion}>¿Confirmar venta?</Text>
            <Text style={styles.modalTextoEvaluacion}>
              Marcarás {'"'}{tituloPublicacion}{'"'} como vendida a {nombreContraparte}.
            </Text>
            <Text style={styles.modalTextoEvaluacion}>
              Después ambos podrán evaluar la experiencia.
            </Text>
            {errorCierreVenta ? (
              <Text accessibilityRole="alert" style={styles.errorCierreVenta}>
                {errorCierreVenta}
              </Text>
            ) : null}
            <View style={styles.accionesEvaluacion}>
              <Pressable
                accessibilityRole="button"
                disabled={cerrandoVenta}
                onPress={() => setModalConfirmarVentaAbierto(false)}
                style={styles.botonCancelarEvaluacion}>
                <Text style={styles.botonCancelarEvaluacionTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: cerrandoVenta, disabled: cerrandoVenta }}
                disabled={cerrandoVenta}
                onPress={() => void confirmarVentaReal()}
                style={[
                  styles.botonGuardarEvaluacion,
                  cerrandoVenta && styles.botonEvaluacionDeshabilitado,
                ]}>
                {cerrandoVenta ? (
                  <ActivityIndicator color={colors.navy} size="small" />
                ) : (
                  <Text style={styles.botonGuardarEvaluacionTexto}>Confirmar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalEvaluacionAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEvaluacionAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalEvaluacion}>
            <View style={styles.iconoModalEvaluacion}>
              <MaterialCommunityIcons name="star-circle-outline" size={34} color={colors.gold} />
            </View>
            <Text style={styles.modalTituloEvaluacion}>Evalúa a {nombreContraparte}</Text>
            <Text style={styles.modalTextoEvaluacion}>
              Tu calificación ayuda a fortalecer la comunidad.
            </Text>
            <Text style={styles.etiquetaEvaluacion}>Tu evaluación *</Text>
            <EstrellasMomentaneo
              valor={estrellasSeleccionadas}
              editable
              tamano={34}
              onCambiar={setEstrellasSeleccionadas}
            />
            {errorCalificacion ? (
              <Text accessibilityRole="alert" style={styles.errorCalificacion}>
                {errorCalificacion}
              </Text>
            ) : null}
            <Text style={styles.etiquetaEvaluacion}>Comentario (opcional)</Text>
            <TextInput
              value={comentarioEvaluacion}
              onChangeText={setComentarioEvaluacion}
              maxLength={500}
              multiline
              placeholder="Cuéntanos cómo fue tu experiencia…"
              placeholderTextColor={colors.muted}
              style={styles.inputComentario}
            />
            <View style={styles.accionesEvaluacion}>
              <Pressable
                accessibilityRole="button"
                disabled={guardandoCalificacion}
                onPress={() => setModalEvaluacionAbierto(false)}
                style={styles.botonCancelarEvaluacion}>
                <Text style={styles.botonCancelarEvaluacionTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  busy: guardandoCalificacion,
                  disabled: estrellasSeleccionadas < 1 || guardandoCalificacion,
                }}
                disabled={estrellasSeleccionadas < 1 || guardandoCalificacion}
                onPress={() => void guardarEvaluacion()}
                style={[
                  styles.botonGuardarEvaluacion,
                  (estrellasSeleccionadas < 1 || guardandoCalificacion) &&
                    styles.botonEvaluacionDeshabilitado,
                ]}>
                {guardandoCalificacion ? (
                  <ActivityIndicator color={colors.navy} size="small" />
                ) : (
                  <Text style={styles.botonGuardarEvaluacionTexto}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function BotonVolver() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver a chats"
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace('/chats');
      }}
      style={styles.volver}>
      <MaterialCommunityIcons name="arrow-left" size={23} color={colors.navy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  barra: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 58,
    paddingHorizontal: spacing.padSm,
  },
  volver: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  barraInformacion: { flex: 1, minWidth: 0 },
  barraTitulo: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  filaPresencia: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
  },
  indicadorPresencia: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  indicadorPresenciaEnLinea: {
    backgroundColor: colors.success,
  },
  indicadorPresenciaDesconectado: {
    backgroundColor: colors.border,
  },
  barraSubtitulo: { color: colors.muted, fontSize: 11 },
  tarjetaCierreVenta: {
    alignItems: 'center',
    backgroundColor: '#fff8dc',
    borderBottomColor: colors.gold,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 9,
  },
  iconoCierreVenta: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  cierreVentaTexto: { flex: 1 },
  cierreVentaTitulo: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  cierreVentaDescripcion: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 1 },
  botonVender: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  botonVenderTexto: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  botonEvaluar: {
    alignItems: 'center',
    borderColor: colors.navy,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  botonEvaluacionEnviada: {
    alignItems: 'center',
    backgroundColor: '#e6f4ff',
    borderRadius: spacing.radiusSm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  botonEvaluarTexto: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  producto: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 9,
  },
  productoPresionado: { opacity: 0.88 },
  productoTexto: { flex: 1, minWidth: 0 },
  productoEtiqueta: { color: 'rgba(255,255,255,0.72)', fontSize: 10 },
  productoTitulo: { color: colors.card, fontSize: 13, fontWeight: '700' },
  mensajes: { flexGrow: 1, gap: spacing.padSm, padding: spacing.padMd, paddingBottom: spacing.padLg },
  avisoSeguridad: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff8dc',
    borderColor: colors.gold,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    maxWidth: '94%',
    paddingHorizontal: spacing.padSm,
    paddingVertical: 7,
  },
  avisoSeguridadTexto: { color: colors.navy, flexShrink: 1, fontSize: 11, lineHeight: 15 },
  estado: { alignItems: 'center', gap: spacing.padSm, paddingVertical: spacing.padLg },
  estadoTexto: { color: colors.muted, fontSize: 14 },
  error: { alignItems: 'center', gap: spacing.padSm, paddingVertical: spacing.padMd },
  errorTexto: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  reintentar: { backgroundColor: colors.gold, borderRadius: spacing.radiusMd, paddingHorizontal: spacing.padMd, paddingVertical: 10 },
  reintentarTexto: { color: colors.navy, fontWeight: '700' },
  sinMensajes: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  filaMensaje: { flexDirection: 'row' },
  filaPropia: { justifyContent: 'flex-end' },
  filaOtra: { justifyContent: 'flex-start' },
  burbuja: { borderRadius: 18, maxWidth: '80%', paddingHorizontal: 12, paddingTop: 9 },
  burbujaPropia: { backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  burbujaOtra: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderColor: colors.border, borderWidth: 1 },
  textoMensaje: { fontSize: 14, lineHeight: 20 },
  textoPropio: { color: colors.card },
  textoOtro: { color: colors.navy },
  metaMensaje: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: 3, marginTop: 2, paddingBottom: 5 },
  hora: { fontSize: 10 },
  horaPropia: { color: 'rgba(255,255,255,0.68)' },
  horaOtra: { color: colors.muted },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.padSm,
  },
  cajaTexto: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    maxHeight: 112,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  input: { color: colors.navy, fontSize: 14, maxHeight: 96, minHeight: 42, paddingVertical: 10, textAlignVertical: 'center' },
  botonEnviar: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  botonEnviarDeshabilitado: { opacity: 0.45 },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,43,73,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  modalAcciones: {
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
  accionMenuVender: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  accionMenuVenderTexto: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  accionMenuReportar: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: colors.error,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  accionMenuReportarTexto: { color: colors.error, fontSize: 14, fontWeight: '800' },
  botonCerrarAcciones: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  modalEvaluacion: {
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
  iconoModalEvaluacion: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  modalTituloEvaluacion: { color: colors.navy, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  modalTextoEvaluacion: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  errorCierreVenta: { color: colors.error, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  errorCalificacion: { alignSelf: 'stretch', color: colors.error, fontSize: 12, lineHeight: 17 },
  etiquetaEvaluacion: { alignSelf: 'flex-start', color: colors.navy, fontSize: 13, fontWeight: '700', marginTop: 4 },
  inputComentario: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    color: colors.navy,
    minHeight: 88,
    padding: spacing.padSm,
    textAlignVertical: 'top',
  },
  accionesEvaluacion: { flexDirection: 'row', gap: spacing.padSm, marginTop: spacing.padSm, width: '100%' },
  botonCancelarEvaluacion: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonCancelarEvaluacionTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  botonGuardarEvaluacion: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonGuardarEvaluacionTexto: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  botonEvaluacionDeshabilitado: { opacity: 0.45 },
});
