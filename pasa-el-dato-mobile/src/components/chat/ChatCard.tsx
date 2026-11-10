import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import type { ConversacionChat } from '@/lib/chat/chat-api';
import { colors, spacing } from '@/theme';

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

export function ChatCard({ conversacion }: { conversacion: ConversacionChat }) {
  const tituloPublicacion =
    conversacion.publicacion.titulo ?? 'Publicación no disponible';
  const hayNoLeidos = conversacion.noLeidosCount > 0;
  const noDisponible = conversacion.publicacion.estado === 'NO_DISPONIBLE';
  const ultimoMensaje = conversacion.ultimoMensaje?.texto ?? 'Aún no hay mensajes';
  const ventaCerrada = conversacion.publicacion.estadoVenta === 'Vendido';
  const etiquetaCierre = ventaCerrada
    ? conversacion.rolEnTransaccion === 'vendedor'
      ? 'Venta realizada'
      : 'Compra realizada'
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir chat sobre ${tituloPublicacion}`}
      onPress={() =>
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: conversacion.conversacionId,
            titulo: tituloPublicacion,
            contraparteNombre: conversacion.contraparte.primerNombre,
            contraparteCuentaId: conversacion.contraparteCuentaId,
            contraparteEnLinea: String(conversacion.contraparte.enLinea),
            publicacionId: conversacion.publicacionId ?? conversacion.publicacion.id,
            rolEnTransaccion: conversacion.rolEnTransaccion,
            estadoPublicacion: conversacion.publicacion.estado,
          },
        })
      }
      style={({ pressed }) => [
        styles.tarjeta,
        hayNoLeidos ? styles.tarjetaPendiente : null,
        noDisponible ? styles.tarjetaNoDisponible : null,
        pressed && styles.pressed,
      ]}>
      <Avatar nombre={tituloPublicacion} tamano={44} />

      <View style={styles.cuerpo}>
        <View style={styles.filaTitulo}>
          <Text style={styles.titulo} numberOfLines={1}>
            {tituloPublicacion}
          </Text>
          <Text style={styles.fecha}>{formatearFecha(conversacion.actividadEn)}</Text>
        </View>

        {etiquetaCierre ? (
          <View style={styles.estadoCierre}>
            <MaterialCommunityIcons name="check-decagram-outline" size={13} color={colors.gold} />
            <Text style={styles.estadoCierreTexto}>{etiquetaCierre}</Text>
          </View>
        ) : null}

        <View style={styles.filaContraparte}>
          <View
            accessibilityLabel={
              conversacion.contraparte.enLinea ? 'Usuario en línea' : 'Usuario desconectado'
            }
            style={[
              styles.indicadorConexion,
              conversacion.contraparte.enLinea
                ? styles.indicadorEnLinea
                : styles.indicadorDesconectado,
            ]}
          />
          <Text style={styles.contraparte} numberOfLines={1}>
            {conversacion.contraparte.primerNombre}
            {conversacion.contraparte.enLinea ? ' · En línea' : ''}
          </Text>
        </View>

        <Text style={styles.ultimoMensaje} numberOfLines={2}>
          {ultimoMensaje}
        </Text>
      </View>

      {hayNoLeidos ? (
        <View style={styles.badgeNoLeidos}>
          <Text style={styles.badgeNoLeidosTexto}>{conversacion.noLeidosCount}</Text>
        </View>
      ) : null}

      {noDisponible ? (
        <View style={styles.badgeNoDisponible}>
          <Text style={styles.badgeNoDisponibleTexto}>No disponible</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.padSm,
    padding: spacing.padSm,
  },
  tarjetaPendiente: {
    borderColor: colors.success,
  },
  tarjetaNoDisponible: {
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  cuerpo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  filaTitulo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  titulo: {
    color: colors.navy,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  fecha: {
    color: colors.muted,
    flexShrink: 0,
    fontSize: 12,
  },
  estadoCierre: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    marginTop: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  estadoCierreTexto: { color: colors.card, fontSize: 10, fontWeight: '800' },
  filaContraparte: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  indicadorConexion: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  indicadorEnLinea: {
    backgroundColor: colors.success,
  },
  indicadorDesconectado: {
    backgroundColor: colors.border,
  },
  contraparte: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
  },
  ultimoMensaje: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  badgeNoLeidos: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 11,
    flexShrink: 0,
    height: 22,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 6,
  },
  badgeNoLeidosTexto: {
    color: colors.card,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeNoDisponible: {
    backgroundColor: colors.error,
    borderRadius: 999,
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeNoDisponibleTexto: {
    color: colors.card,
    fontSize: 10,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
