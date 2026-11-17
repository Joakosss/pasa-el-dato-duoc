import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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

import { ApiError } from '@/lib/api';
import { crearReporteUsuario } from '@/lib/api/reportes-usuarios';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

export default function ReportarUsuarioScreen() {
  const { id, nombre } = useLocalSearchParams<{ id: string; nombre?: string }>();
  const accessToken = useSesionStore(selectAccessToken);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);

  const nombreUsuario = nombre ?? 'este usuario';

  const enviarReporte = async () => {
    const descripcionNormalizada = descripcion.trim();

    if (descripcionNormalizada.length < 10) {
      setError('Describe el problema con al menos 10 caracteres.');
      return;
    }

    if (!id || !accessToken || enviando) {
      setError('Debes iniciar sesión para enviar un reporte.');
      return;
    }

    setEnviando(true);
    setError(undefined);

    try {
      await crearReporteUsuario(id, { descripcion: descripcionNormalizada }, accessToken);
      setConfirmacionVisible(true);
    } catch (causa: unknown) {
      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos enviar el reporte. Inténtalo nuevamente.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const volver = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/chats');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la conversación"
          onPress={volver}
          style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.barraTitulo}>Reportar usuario</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.aviso}>
          <MaterialCommunityIcons name="shield-alert-outline" size={25} color={colors.error} />
          <View style={styles.avisoTexto}>
            <Text style={styles.avisoTitulo}>Ayúdanos a cuidar la comunidad</Text>
            <Text style={styles.avisoDescripcion}>
              Reporta a {nombreUsuario} solo si incumple las normas o presenta un comportamiento
              sospechoso. Nuestro equipo revisará el caso.
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <View style={styles.encabezadoCampo}>
            <Text style={styles.etiqueta}>¿Qué ocurrió? *</Text>
            <Text style={styles.contador}>{descripcion.length}/500</Text>
          </View>
          <Text style={styles.ayuda}>
            Incluye los antecedentes necesarios para que podamos revisar el reporte.
          </Text>
          <TextInput
            value={descripcion}
            onChangeText={(valor) => {
              setDescripcion(valor);
              setError(undefined);
            }}
            multiline
            maxLength={500}
            placeholder="Describe el comportamiento o situación que deseas reportar…"
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
            style={styles.input}
          />
        </View>

        <View style={styles.nota}>
          <MaterialCommunityIcons name="lock-outline" size={16} color={colors.muted} />
          <Text style={styles.notaTexto}>
            Tu identidad no será compartida con la persona reportada.
          </Text>
        </View>

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: enviando, disabled: enviando }}
          disabled={enviando}
          onPress={() => void enviarReporte()}
          style={({ pressed }) => [
            styles.botonEnviar,
            enviando && styles.botonDeshabilitado,
            pressed && styles.pressed,
          ]}>
          {enviando ? (
            <ActivityIndicator color={colors.card} size="small" />
          ) : (
            <MaterialCommunityIcons name="flag-outline" size={19} color={colors.card} />
          )}
          <Text style={styles.botonEnviarTexto}>
            {enviando ? 'Enviando reporte…' : 'Enviar reporte'}
          </Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={confirmacionVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.iconoExito}>
              <MaterialCommunityIcons name="check" size={38} color={colors.navy} />
            </View>
            <Text style={styles.modalTitulo}>Reporte enviado</Text>
            <Text style={styles.modalTexto}>
              Gracias por ayudar a mantener una comunidad segura. Nuestro equipo revisará el caso.
            </Text>
            <Pressable accessibilityRole="button" onPress={volver} style={styles.botonListo}>
              <Text style={styles.botonListoTexto}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  barra: {
    alignItems: 'center', backgroundColor: colors.card, borderBottomColor: colors.border,
    borderBottomWidth: 1, flexDirection: 'row', gap: spacing.padSm, minHeight: 58,
    paddingHorizontal: spacing.padSm,
  },
  volver: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  barraTitulo: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  contenido: { gap: spacing.padMd, padding: spacing.padMd, paddingBottom: spacing.padLg },
  aviso: {
    alignItems: 'flex-start', backgroundColor: '#fef2f2', borderColor: colors.error,
    borderRadius: spacing.radiusLg, borderWidth: 1, flexDirection: 'row', gap: spacing.padSm,
    padding: spacing.padMd,
  },
  avisoTexto: { flex: 1, gap: 3 },
  avisoTitulo: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  avisoDescripcion: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  seccion: { gap: 8 },
  encabezadoCampo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  etiqueta: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  contador: { color: colors.muted, fontSize: 12 },
  ayuda: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  input: {
    backgroundColor: colors.card, borderColor: colors.border, borderRadius: spacing.radiusMd,
    borderWidth: 1, color: colors.navy, fontSize: 14, minHeight: 150, padding: spacing.padSm,
  },
  nota: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  notaTexto: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 16 },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  botonEnviar: {
    alignItems: 'center', backgroundColor: colors.error, borderRadius: spacing.radiusMd,
    flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: spacing.touchMin,
  },
  botonEnviarTexto: { color: colors.card, fontSize: 15, fontWeight: '800' },
  botonDeshabilitado: { opacity: 0.7 },
  pressed: { opacity: 0.9 },
  overlay: { backgroundColor: 'rgba(0,43,73,0.6)', flex: 1, justifyContent: 'center', padding: spacing.padLg },
  modal: {
    alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border,
    borderRadius: spacing.radiusLg, borderWidth: 1, gap: spacing.padMd, padding: spacing.padLg,
  },
  iconoExito: {
    alignItems: 'center', backgroundColor: colors.gold, borderRadius: 34, height: 68,
    justifyContent: 'center', width: 68,
  },
  modalTitulo: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  modalTexto: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  botonListo: {
    alignItems: 'center', backgroundColor: colors.gold, borderRadius: spacing.radiusMd,
    justifyContent: 'center', minHeight: spacing.touchMin, width: '100%',
  },
  botonListoTexto: { color: colors.navy, fontSize: 15, fontWeight: '800' },
});
