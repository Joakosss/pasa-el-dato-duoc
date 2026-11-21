import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type PestanaChats = 'ventas' | 'compras';

export default function ChatsScreen() {
  const accessToken = useSesionStore(selectAccessToken);
  const [conversaciones, setConversaciones] = useState<ConversacionChat[]>([]);
  const [pestanaActiva, setPestanaActiva] = useState<PestanaChats>('ventas');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorMas, setErrorMas] = useState(false);
  const generacion = useRef(0);
  const cargaAdicional = useRef(false);
  const sondeo = useRef(false);
  const sesionLista = useRef(useSesionStore.getState().sesion);

  const cargarConversaciones = useCallback(async (mostrarCarga = true) => {
    if (!mostrarCarga && sondeo.current) return;
    const solicitud = mostrarCarga ? ++generacion.current : generacion.current;
    const sesion = useSesionStore.getState().sesion;
    if (sesionLista.current !== sesion) {
      sesionLista.current = sesion;
      setConversaciones([]);
    }
    if (!mostrarCarga) sondeo.current = true;
    if (mostrarCarga) {
      cargaAdicional.current = false;
      setCargandoMas(false);
      setErrorMas(false);
      setCursor(null);
    }
    if (!accessToken) {
      sondeo.current = false;
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
      if (solicitud !== generacion.current || useSesionStore.getState().sesion !== sesion) return;
      if (mostrarCarga) {
        setConversaciones(respuesta.items);
        setCursor(respuesta.nextCursor);
      } else {
        setConversaciones((actuales) => {
          const porId = new Map(actuales.map((item) => [item.conversacionId, item]));
          respuesta.items.forEach((item) => porId.set(item.conversacionId, item));
          return [...porId.values()].sort((a, b) => b.actividadEn.localeCompare(a.actividadEn));
        });
      }
    } catch {
      if (mostrarCarga && solicitud === generacion.current && useSesionStore.getState().sesion === sesion) {
        setError('No pudimos cargar tus conversaciones. Revisa tu conexión e intenta nuevamente.');
      }
    } finally {
      if (!mostrarCarga) sondeo.current = false;
      if (mostrarCarga && solicitud === generacion.current && useSesionStore.getState().sesion === sesion) {
        setCargando(false);
      }
    }
  }, [accessToken]);

  const cargarMas = useCallback(async () => {
    if (!accessToken || !cursor || cargaAdicional.current) return;
    const solicitud = generacion.current;
    const sesion = useSesionStore.getState().sesion;
    cargaAdicional.current = true;
    setCargandoMas(true);
    setErrorMas(false);
    try {
      const respuesta = await listarConversaciones(accessToken, cursor);
      if (solicitud !== generacion.current || useSesionStore.getState().sesion !== sesion) return;
      setConversaciones((actuales) => {
        const porId = new Map(actuales.map((item) => [item.conversacionId, item]));
        respuesta.items.forEach((item) => {
          if (!porId.has(item.conversacionId)) porId.set(item.conversacionId, item);
        });
        return [...porId.values()].sort((a, b) => b.actividadEn.localeCompare(a.actividadEn));
      });
      setCursor(respuesta.nextCursor);
    } catch {
      if (solicitud === generacion.current && useSesionStore.getState().sesion === sesion) setErrorMas(true);
    } finally {
      if (solicitud === generacion.current && useSesionStore.getState().sesion === sesion) {
        cargaAdicional.current = false;
        setCargandoMas(false);
      }
    }
  }, [accessToken, cursor]);

  useEffect(() => {
    void Promise.resolve().then(() => cargarConversaciones());

    const intervalo = setInterval(() => {
      void cargarConversaciones(false);
    }, 2_000);

    return () => {
      generacion.current += 1;
      clearInterval(intervalo);
    };
  }, [cargarConversaciones]);

  const ventas = useMemo(
    () =>
      conversaciones.filter(
        (conversacion) => conversacion.rolEnTransaccion === 'vendedor',
      ),
    [conversaciones],
  );
  const compras = useMemo(
    () =>
      conversaciones.filter(
        (conversacion) => conversacion.rolEnTransaccion === 'comprador',
      ),
    [conversaciones],
  );
  const conversacionesVisibles = pestanaActiva === 'ventas' ? ventas : compras;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={conversacionesVisibles}
        keyExtractor={(conversacion) => conversacion.conversacionId}
        renderItem={({ item }) => <ChatCard conversacion={item} />}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshing={cargando && conversaciones.length > 0}
        onRefresh={() => void cargarConversaciones()}
        ListHeaderComponent={
          <>
            <View style={styles.cabecera}>
              <Text style={styles.titulo}>Mis chats</Text>
              <View style={styles.total}>
                <Text style={styles.totalTexto}>{conversaciones.length}{cursor ? '+' : ''}</Text>
              </View>
            </View>

            <View style={styles.selectorPestanas}>
              <BotonPestana
                activa={pestanaActiva === 'ventas'}
                cantidad={ventas.length}
                icono="tag-outline"
                etiqueta="Mis ventas"
                onPress={() => setPestanaActiva('ventas')}
              />
              <BotonPestana
                activa={pestanaActiva === 'compras'}
                cantidad={compras.length}
                icono="cart-outline"
                etiqueta="Mis compras"
                onPress={() => setPestanaActiva('compras')}
              />
            </View>

            <Text style={styles.descripcionPestana}>Contadores de conversaciones cargadas{cursor ? '; hay más disponibles' : ''}.</Text>
            <Text style={styles.descripcionPestana}>
              {pestanaActiva === 'ventas'
                ? 'Personas interesadas en tus publicaciones.'
                : 'Publicaciones que te interesan o compraste.'}
            </Text>
          </>
        }
        ListFooterComponent={
          cursor ? (
            <Pressable
              accessibilityRole="button"
              disabled={cargandoMas}
              onPress={() => void cargarMas()}
              style={styles.botonReintentar}>
              <Text style={styles.botonReintentarTexto}>
                {cargandoMas ? 'Cargando…' : errorMas ? 'Reintentar carga' : 'Cargar más conversaciones'}
              </Text>
            </Pressable>
          ) : null
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
          ) : cursor ? (
            <View style={styles.estado}>
              <Text style={styles.estadoTexto}>No hay conversaciones en esta página para la pestaña seleccionada. Puedes cargar más.</Text>
            </View>
          ) : conversaciones.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <View style={styles.estado}>
              <View style={styles.iconoEstado}>
                <MaterialCommunityIcons
                  name={pestanaActiva === 'ventas' ? 'tag-outline' : 'cart-outline'}
                  size={28}
                  color={colors.gold}
                />
              </View>
              <Text style={styles.estadoTitulo}>
                {pestanaActiva === 'ventas'
                  ? 'Aún no tienes conversaciones de venta'
                  : 'Aún no tienes conversaciones de compra'}
              </Text>
              <Text style={styles.estadoTexto}>
                {pestanaActiva === 'ventas'
                  ? 'Cuando alguien consulte por una publicación tuya, aparecerá aquí.'
                  : 'Cuando escribas a una persona vendedora, aparecerá aquí.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function BotonPestana({
  activa,
  cantidad,
  icono,
  etiqueta,
  onPress,
}: {
  activa: boolean;
  cantidad: number;
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  etiqueta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.botonPestana,
        activa && styles.botonPestanaActivo,
        pressed && styles.pressed,
      ]}>
      <MaterialCommunityIcons
        name={icono}
        size={18}
        color={activa ? colors.gold : colors.navy}
      />
      <Text
        style={[
          styles.botonPestanaTexto,
          activa && styles.botonPestanaTextoActivo,
        ]}>
        {etiqueta}
      </Text>
      <View
        style={[
          styles.contadorPestana,
          activa && styles.contadorPestanaActivo,
        ]}>
        <Text
          style={[
            styles.contadorPestanaTexto,
            activa && styles.contadorPestanaTextoActivo,
          ]}>
          {cantidad}
        </Text>
      </View>
    </Pressable>
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
  selectorPestanas: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 5,
  },
  botonPestana: {
    alignItems: 'center',
    borderRadius: spacing.radiusSm,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 7,
  },
  botonPestanaActivo: { backgroundColor: colors.navy },
  botonPestanaTexto: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  botonPestanaTextoActivo: { color: colors.card },
  contadorPestana: {
    alignItems: 'center',
    backgroundColor: '#fff8dc',
    borderColor: colors.gold,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
  },
  contadorPestanaActivo: { backgroundColor: colors.gold, borderColor: colors.gold },
  contadorPestanaTexto: { color: colors.navy, fontSize: 10, fontWeight: '800' },
  contadorPestanaTextoActivo: { color: colors.navy },
  descripcionPestana: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 2,
    marginTop: spacing.padSm,
  },
  estado: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    justifyContent: 'center',
    marginTop: spacing.padSm,
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
  estadoTitulo: { color: colors.navy, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  estadoTexto: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  errorTexto: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  botonReintentar: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  botonReintentarTexto: {
    color: colors.navy,
    fontWeight: '700',
  },
  pressed: { opacity: 0.9 },
});
