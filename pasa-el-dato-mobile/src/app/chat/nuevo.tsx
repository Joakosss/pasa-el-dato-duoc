import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { iniciarConversacionConMensaje } from '@/lib/chat/chat-api';
import { ApiError } from '@/lib/api';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

export default function NuevoChatScreen() {
  const { publicacionId, titulo, vendedorNombre } = useLocalSearchParams<{
    publicacionId: string;
    titulo?: string;
    vendedorNombre?: string;
  }>();
  const accessToken = useSesionStore(selectAccessToken);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const tituloPublicacion = titulo ?? 'Publicación';
  const nombreVendedor = vendedorNombre ?? 'la persona vendedora';
  const mensajeSugerido = `Hola ${nombreVendedor}, ¿sigue disponible?`;

  const enviarPrimerMensaje = async () => {
    const contenido = texto.trim();
    if (!publicacionId || !accessToken || !contenido || enviando) return;

    setEnviando(true);

    try {
      const resultado = await iniciarConversacionConMensaje(
        accessToken,
        publicacionId,
        contenido,
      );

      router.replace({
        pathname: '/chat/[id]',
        params: {
          id: resultado.conversacionId,
          titulo: tituloPublicacion,
          contraparteNombre: nombreVendedor,
        },
      });
    } catch (causa: unknown) {
      Alert.alert(
        'No se pudo enviar el mensaje',
        causa instanceof ApiError
          ? causa.message
          : 'Revisa tu conexión e intenta nuevamente.',
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al detalle de publicación"
          onPress={() => router.back()}
          style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={23} color={colors.navy} />
        </Pressable>
        <Avatar nombre={tituloPublicacion} tamano={36} />
        <View style={styles.barraInformacion}>
          <Text style={styles.barraTitulo}>Nuevo mensaje</Text>
          <Text style={styles.barraSubtitulo} numberOfLines={1}>
            {tituloPublicacion}
          </Text>
        </View>
      </View>

      <View style={styles.contenido}>
        <View style={styles.aviso}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.navy} />
          <Text style={styles.avisoTexto}>
            La conversación se creará solo cuando envíes este primer mensaje.
          </Text>
        </View>

        <Text style={styles.etiqueta}>Mensaje para {nombreVendedor}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Usar mensaje sugerido para ${nombreVendedor}`}
          onPress={() => setTexto(mensajeSugerido)}
          style={({ pressed }) => [
            styles.botonSugerido,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={17}
            color={colors.navy}
          />
          <Text style={styles.botonSugeridoTexto}>{mensajeSugerido}</Text>
        </Pressable>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder={mensajeSugerido}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          style={styles.input}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.pie}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar primer mensaje"
            accessibilityState={{ disabled: !texto.trim() || enviando }}
            disabled={!texto.trim() || enviando}
            onPress={() => void enviarPrimerMensaje()}
            style={[
              styles.botonEnviar,
              (!texto.trim() || enviando) && styles.deshabilitado,
            ]}>
            {enviando ? (
              <ActivityIndicator color={colors.navy} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={19} color={colors.navy} />
                <Text style={styles.botonEnviarTexto}>Enviar mensaje</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  contenido: { flex: 1, gap: spacing.padMd, padding: spacing.padMd },
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
  etiqueta: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  botonSugerido: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderColor: colors.navy,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    maxWidth: '100%',
    paddingHorizontal: spacing.padSm,
    paddingVertical: 10,
  },
  botonSugeridoTexto: {
    color: colors.navy,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    color: colors.navy,
    fontSize: 15,
    minHeight: 130,
    padding: spacing.padMd,
    textAlignVertical: 'top',
  },
  pie: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.padSm,
  },
  botonEnviar: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonEnviarTexto: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  deshabilitado: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
});
