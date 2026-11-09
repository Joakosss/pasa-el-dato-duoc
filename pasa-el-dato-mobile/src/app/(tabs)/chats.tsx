import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatCard } from '@/components/chat/ChatCard';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import {
  listarConversaciones,
  type ConversacionChat,
} from '@/lib/chat/chat-api';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

export default function ChatsScreen() {
  const accessToken = useSesionStore(selectAccessToken);
  const [conversaciones, setConversaciones] = useState<ConversacionChat[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarConversaciones = useCallback(async (mostrarCarga = true) => {
    if (!accessToken) {
      setConversaciones([]);
      setError('Inicia sesión para ver tus conversaciones.');
      setCargando(false);
      return;
    }

    if (mostrarCarga) {
      setCargando(true);
      setError(null);
    }

    try {
      const respuesta = await listarConversaciones(accessToken);
      setConversaciones(respuesta.items);
    } catch {
      if (mostrarCarga) {
        setError('No pudimos cargar tus conversaciones. Revisa tu conexión e intenta nuevamente.');
      }
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    void Promise.resolve().then(() => cargarConversaciones());

    const intervalo = setInterval(() => {
      void cargarConversaciones(false);
    }, 2_000);

    return () => clearInterval(intervalo);
  }, [cargarConversaciones]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={conversaciones}
        keyExtractor={(conversacion) => conversacion.conversacionId}
        renderItem={({ item }) => <ChatCard conversacion={item} />}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshing={cargando && conversaciones.length > 0}
        onRefresh={() => void cargarConversaciones()}
        ListHeaderComponent={
          <View style={styles.cabecera}>
            <Text style={styles.titulo}>Mis chats</Text>
            <View style={styles.total}>
              <Text style={styles.totalTexto}>{conversaciones.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <View style={styles.estado}>
              <ActivityIndicator color={colors.navy} />
              <Text style={styles.estadoTexto}>Cargando conversaciones…</Text>
            </View>
          ) : error ? (
            <View style={styles.estado}>
              <Text style={styles.errorTexto}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void cargarConversaciones()}
                style={styles.botonReintentar}>
                <Text style={styles.botonReintentarTexto}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <ChatEmptyState />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contenido: {
    flexGrow: 1,
    gap: spacing.padSm,
    paddingBottom: spacing.padLg,
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padMd,
  },
  cabecera: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.padSm,
  },
  titulo: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
  },
  total: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 8,
  },
  totalTexto: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  estado: {
    alignItems: 'center',
    gap: spacing.padSm,
    justifyContent: 'center',
    paddingVertical: spacing.padLg,
  },
  estadoTexto: {
    color: colors.muted,
    fontSize: 14,
  },
  errorTexto: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  botonReintentar: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    justifyContent: 'center',
  },
  botonReintentarTexto: {
    color: colors.navy,
    fontWeight: '700',
  },
});
