import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { Avatar } from '@/components/ui/Avatar';
import { esChatDeVenta, type ChatFeed } from '@/lib/chat/chats-placeholder';

// Espejo del ChatCard web: avatar con las iniciales del producto, título,
// contraparte (con marca dorada cuando el chat es de un producto propio),
// último mensaje y estado a la derecha.
type EstadoChat = 'pendiente' | 'vendido' | 'alDia';

function estadoDeChat(chat: ChatFeed): EstadoChat {
  if (chat.vendido) return 'vendido';
  if (chat.noLeidos > 0) return 'pendiente';
  return 'alDia';
}

// Meses cortos en es-CL, sin depender de Intl (comportamiento igual en
// dispositivo y web).
const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sept',
  'oct',
  'nov',
  'dic',
];

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()] ?? ''}`.trim();
}

export function ChatCard({ chat }: { chat: ChatFeed }) {
  const estado = estadoDeChat(chat);
  const deVenta = esChatDeVenta(chat);

  return (
    <View
      style={[
        styles.tarjeta,
        estado === 'pendiente' ? styles.tarjetaPendiente : null,
        estado === 'vendido' ? styles.tarjetaVendida : null,
        deVenta ? styles.tarjetaDeVenta : null,
      ]}>
      <Avatar nombre={chat.productoTitulo} tamano={44} />

      <View style={styles.cuerpo}>
        <View style={styles.filaTitulo}>
          <Text style={styles.titulo} numberOfLines={1}>
            {chat.productoTitulo}
          </Text>
          <Text style={styles.fecha}>{formatearFecha(chat.ultimaFecha)}</Text>
        </View>

        <View style={styles.filaContraparte}>
          {deVenta ? <View style={styles.punto} /> : null}
          <Text
            style={[styles.contraparte, deVenta ? styles.contraparteDeVenta : null]}
            numberOfLines={1}>
            {chat.contraparte}
          </Text>
        </View>

        <Text style={styles.ultimoMensaje} numberOfLines={2}>
          {chat.ultimoMensaje}
        </Text>
      </View>

      {estado === 'pendiente' ? (
        <View style={styles.badgeNoLeidos}>
          <Text style={styles.badgeNoLeidosTexto}>{chat.noLeidos}</Text>
        </View>
      ) : null}

      {estado === 'vendido' ? (
        <View style={styles.badgeVendido}>
          <Text style={styles.badgeVendidoTexto}>Vendido</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.padSm,
    padding: spacing.padSm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
  },
  // Con mensajes sin leer el chat queda marcado con borde verde.
  tarjetaPendiente: {
    borderColor: colors.success,
  },
  // Vendido: tarjeta atenuada, como en el diseño web.
  tarjetaVendida: {
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  // Producto propio: franja dorada izquierda.
  tarjetaDeVenta: {
    borderLeftColor: colors.gold,
    borderLeftWidth: 4,
  },
  cuerpo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titulo: {
    flexShrink: 1,
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  fecha: {
    flexShrink: 0,
    color: colors.muted,
    fontSize: 12,
  },
  filaContraparte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  contraparte: {
    flexShrink: 1,
    color: colors.muted,
    fontSize: 12,
  },
  contraparteDeVenta: {
    color: colors.navy,
    fontWeight: '600',
  },
  ultimoMensaje: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  badgeNoLeidos: {
    flexShrink: 0,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNoLeidosTexto: {
    color: colors.card,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeVendido: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.error,
  },
  badgeVendidoTexto: {
    color: colors.card,
    fontSize: 11,
    fontWeight: '700',
  },
});
