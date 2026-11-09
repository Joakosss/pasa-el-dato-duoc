import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
  const { id, titulo, contraparteNombre } = useLocalSearchParams<{
    id: string;
    titulo?: string;
    contraparteNombre?: string;
  }>();
  const accessToken = useSesionStore(selectAccessToken);
  const sesion = useSesionStore(selectSesion);
  const [texto, setTexto] = useState('');
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const socketRef = useRef<SocketChat | null>(null);

  const conversacionId = id ?? '';
  const tituloPublicacion = titulo ?? 'Conversación';
  const nombreContraparte = contraparteNombre ?? 'Usuario';

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
    if (!accessToken || !conversacionId) return;

    const socket = crearSocketChat(accessToken);
    socketRef.current = socket;

    const quitarListener = socket.alRecibirMensaje((mensaje) => {
      if (mensaje.conversacionId !== conversacionId) return;
      setMensajes((actuales) => agregarMensajeSinDuplicados(actuales, mensaje));
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
      socket.desconectar();
      socketRef.current = null;
    };
  }, [accessToken, conversacionId]);

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
          <Text style={styles.barraSubtitulo} numberOfLines={1}>
            Conversación por {tituloPublicacion}
          </Text>
        </View>
      </View>

      <View style={styles.producto}>
        <MaterialCommunityIcons name="tag-outline" size={18} color={colors.gold} />
        <View style={styles.productoTexto}>
          <Text style={styles.productoEtiqueta}>Conversación por</Text>
          <Text style={styles.productoTitulo} numberOfLines={1}>
            {tituloPublicacion}
          </Text>
        </View>
      </View>

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
  barraSubtitulo: { color: colors.muted, fontSize: 11, marginTop: 1 },
  producto: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 9,
  },
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
});
