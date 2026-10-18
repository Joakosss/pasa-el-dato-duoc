import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { ChatCard } from '@/components/chat/ChatCard';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { CHATS, esChatDeVenta, type ChatFeed, type RolChat } from '@/lib/chat/chats-placeholder';

// Chats: lista de conversaciones con pestañas por rol (comprando / vendiendo),
// espejo de la sección /chats del front web.
const PESTANAS: { id: RolChat; etiqueta: string }[] = [
  { id: 'comprando', etiqueta: 'Comprando' },
  { id: 'vendiendo', etiqueta: 'Vendiendo' },
];

const CHATS_COMPRANDO: ChatFeed[] = CHATS.filter((chat) => !esChatDeVenta(chat));
const CHATS_VENDIENDO: ChatFeed[] = CHATS.filter(esChatDeVenta);

export default function ChatsScreen() {
  const [rol, setRol] = useState<RolChat>('comprando');
  const listaRef = useRef<FlatList<ChatFeed>>(null);
  const chats = rol === 'vendiendo' ? CHATS_VENDIENDO : CHATS_COMPRANDO;

  const cambiarRol = (siguiente: RolChat) => {
    if (siguiente === rol) return;
    setRol(siguiente);
    // Cada pestaña es una lista distinta: se vuelve al inicio al cambiar.
    listaRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        ref={listaRef}
        data={chats}
        keyExtractor={(chat) => chat.id}
        renderItem={({ item }) => <ChatCard chat={item} />}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <CabeceraChats rol={rol} onCambiarRol={cambiarRol} />
        }
        ListEmptyComponent={<ChatEmptyState />}
      />
    </SafeAreaView>
  );
}

// Título con el total de conversaciones y las pestañas de rol.
function CabeceraChats({
  rol,
  onCambiarRol,
}: {
  rol: RolChat;
  onCambiarRol: (siguiente: RolChat) => void;
}) {
  return (
    <View>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>Mis chats</Text>
        <View style={styles.total}>
          <Text style={styles.totalTexto}>{CHATS.length}</Text>
        </View>
      </View>

      <View
        accessibilityRole="tablist"
        accessibilityLabel="Filtrar chats por rol"
        style={styles.pestanas}>
        {PESTANAS.map((pestana) => {
          const activa = pestana.id === rol;
          const cantidad =
            pestana.id === 'vendiendo'
              ? CHATS_VENDIENDO.length
              : CHATS_COMPRANDO.length;

          return (
            <Pressable
              key={pestana.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={`${pestana.etiqueta}: ${cantidad} chats`}
              onPress={() => onCambiarRol(pestana.id)}
              style={({ pressed }) => [
                styles.pestana,
                activa ? styles.pestanaActiva : styles.pestanaInactiva,
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.pestanaTexto,
                  activa ? styles.pestanaTextoActivo : null,
                ]}>
                {pestana.etiqueta}
              </Text>

              <View
                style={[
                  styles.contador,
                  activa ? styles.contadorActivo : styles.contadorInactivo,
                ]}>
                <Text
                  style={[
                    styles.contadorTexto,
                    activa ? styles.contadorTextoActivo : styles.contadorTextoInactivo,
                  ]}>
                  {cantidad}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contenido: {
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padMd,
    paddingBottom: spacing.padLg,
    gap: spacing.padSm,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: '800',
  },
  total: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTexto: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
  },
  pestanas: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.padMd,
    marginBottom: spacing.padSm,
  },
  pestana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    borderRadius: 999,
    borderWidth: 1,
  },
  pestanaActiva: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  pestanaInactiva: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  pestanaTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  pestanaTextoActivo: {
    color: colors.card,
  },
  contador: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorActivo: {
    backgroundColor: colors.gold,
  },
  contadorInactivo: {
    backgroundColor: colors.navy,
  },
  contadorTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  contadorTextoActivo: {
    color: colors.navy,
  },
  contadorTextoInactivo: {
    color: colors.card,
  },
  pressed: {
    opacity: 0.9,
  },
});
