import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
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
import { CHATS, esChatDeVenta } from '@/lib/chat/chats-placeholder';
import {
  obtenerMensajesChatMomentaneo,
  type MensajeChatMomentaneo,
} from '@/lib/chat/mensajes-momentaneo';
import { colors, spacing } from '@/theme';

function hora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  return fecha.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversacionChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = useMemo(() => CHATS.find((item) => item.id === id), [id]);
  const [texto, setTexto] = useState('');
  const [mensajesMomentaneo, setMensajesMomentaneo] = useState<MensajeChatMomentaneo[]>(
    () => (chat ? obtenerMensajesChatMomentaneo(chat) : []),
  );
  const scrollRef = useRef<ScrollView>(null);

  if (!chat) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.barra}>
          <BotonVolver />
          <Text style={styles.barraTitulo}>Chat</Text>
        </View>
        <View style={styles.vacio}>
          <View style={styles.vacioIcono}>
            <MaterialCommunityIcons name="chat-remove-outline" size={28} color={colors.gold} />
          </View>
          <Text style={styles.vacioTitulo}>Conversación no encontrada</Text>
          <Text style={styles.vacioTexto}>
            Puede que ya no esté disponible o que el enlace no sea válido.
          </Text>
          <Pressable onPress={() => router.replace('/chats')} style={styles.botonVolverChats}>
            <Text style={styles.botonVolverChatsTexto}>Volver a chats</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const deVenta = esChatDeVenta(chat);
  const contraparte = deVenta ? 'Comprador interesado' : chat.contraparte;
  const conversacionCerrada = Boolean(chat.vendido);

  const enviarMensaje = () => {
    const contenido = texto.trim();
    if (!contenido || conversacionCerrada) return;

    setMensajesMomentaneo((actuales) => [
      ...actuales,
      {
        id: `mensaje-momentaneo-${Date.now()}`,
        contenido,
        enviadoPorMi: true,
        fecha: new Date().toISOString(),
      },
    ]);
    setTexto('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.barra}>
        <BotonVolver />
        <Avatar nombre={deVenta ? chat.productoTitulo : chat.contraparte} tamano={36} />
        <View style={styles.barraInformacion}>
          <Text style={styles.barraTitulo} numberOfLines={1}>
            {contraparte}
          </Text>
          <Text style={styles.barraSubtitulo} numberOfLines={1}>
            {deVenta ? 'Tu publicación' : 'Vendedor'} · {chat.productoTitulo}
          </Text>
        </View>
      </View>

      <View style={styles.producto}>
        <MaterialCommunityIcons name="tag-outline" size={18} color={colors.gold} />
        <View style={styles.productoTexto}>
          <Text style={styles.productoEtiqueta}>Conversación por</Text>
          <Text style={styles.productoTitulo} numberOfLines={1}>
            {chat.productoTitulo}
          </Text>
        </View>
        {chat.vendido ? (
          <View style={styles.badgeCerrado}>
            <Text style={styles.badgeCerradoTexto}>Vendido</Text>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
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

          <View style={styles.fecha}>
            <Text style={styles.fechaTexto}>Hoy</Text>
          </View>

          {mensajesMomentaneo.map((mensaje) => (
            <View
              key={mensaje.id}
              style={[
                styles.filaMensaje,
                mensaje.enviadoPorMi ? styles.filaPropia : styles.filaOtra,
              ]}>
              <View
                style={[
                  styles.burbuja,
                  mensaje.enviadoPorMi ? styles.burbujaPropia : styles.burbujaOtra,
                ]}>
                <Text
                  style={[
                    styles.textoMensaje,
                    mensaje.enviadoPorMi ? styles.textoPropio : styles.textoOtro,
                  ]}>
                  {mensaje.contenido}
                </Text>
                <View style={styles.metaMensaje}>
                  <Text
                    style={[
                      styles.hora,
                      mensaje.enviadoPorMi ? styles.horaPropia : styles.horaOtra,
                    ]}>
                    {hora(mensaje.fecha)}
                  </Text>
                  {mensaje.enviadoPorMi ? (
                    <MaterialCommunityIcons name="check-all" size={15} color={colors.gold} />
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {conversacionCerrada ? (
          <View style={styles.composerCerrado}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.muted} />
            <Text style={styles.composerCerradoTexto}>
              Esta conversación está cerrada porque la publicación fue vendida.
            </Text>
          </View>
        ) : (
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
                onSubmitEditing={enviarMensaje}
                blurOnSubmit={false}
                style={styles.input}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: !texto.trim() }}
              disabled={!texto.trim()}
              onPress={enviarMensaje}
              style={[styles.botonEnviar, !texto.trim() && styles.botonEnviarDeshabilitado]}>
              <MaterialCommunityIcons name="send" size={20} color={colors.navy} />
            </Pressable>
          </View>
        )}
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
  volver: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
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
  badgeCerrado: {
    backgroundColor: colors.error,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeCerradoTexto: { color: colors.card, fontSize: 10, fontWeight: '700' },
  mensajes: { gap: spacing.padSm, padding: spacing.padMd, paddingBottom: spacing.padLg },
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
  fecha: { alignSelf: 'center', backgroundColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  fechaTexto: { color: colors.muted, fontSize: 11, fontWeight: '600' },
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
  composerCerrado: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.padMd,
  },
  composerCerradoTexto: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 17 },
  vacio: { alignItems: 'center', flex: 1, gap: 5, justifyContent: 'center', padding: spacing.padLg },
  vacioIcono: { alignItems: 'center', backgroundColor: colors.navy, borderRadius: 30, height: 60, justifyContent: 'center', width: 60 },
  vacioTitulo: { color: colors.navy, fontSize: 17, fontWeight: '800', marginTop: spacing.padSm },
  vacioTexto: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  botonVolverChats: { backgroundColor: colors.gold, borderRadius: spacing.radiusMd, marginTop: spacing.padMd, paddingHorizontal: spacing.padMd, paddingVertical: 12 },
  botonVolverChatsTexto: { color: colors.navy, fontWeight: '700' },
});
