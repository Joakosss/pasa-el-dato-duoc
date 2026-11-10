import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PublicacionCard } from '@/components/feed/PublicacionCard';
import { ApiError } from '@/lib/api';
import {
  listarFavoritos,
  type FavoritoPublicacion,
} from '@/lib/api/favoritos';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

interface FilaGrilla {
  clave: string;
  publicacion: FavoritoPublicacion | null;
}

export default function FavoritosScreen() {
  const accessToken = useSesionStore(selectAccessToken);
  const [favoritos, setFavoritos] = useState<FavoritoPublicacion[]>([]);
  const [totalFavoritos, setTotalFavoritos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const cargarFavoritos = useCallback(async (esActualizacion = false) => {
    if (!accessToken) {
      setFavoritos([]);
      setTotalFavoritos(0);
      setError('Inicia sesión para ver tus favoritos.');
      setCargando(false);
      return;
    }

    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError(undefined);
    try {
      const respuesta = await listarFavoritos(accessToken);
      setFavoritos(respuesta.items);
      setTotalFavoritos(respuesta.total);
    } catch (causa: unknown) {
      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos cargar tus favoritos. Reintenta.',
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void cargarFavoritos();
    }, [cargarFavoritos]),
  );

  const filas = useMemo(() => {
    const items: FilaGrilla[] = favoritos.map((publicacion) => ({
      clave: publicacion.id,
      publicacion,
    }));
    if (items.length % 2 === 1) items.push({ clave: 'relleno', publicacion: null });
    return items;
  }, [favoritos]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
        </Pressable>
        <View style={styles.barraTexto}>
          <Text style={styles.titulo}>Mis favoritos</Text>
          <Text style={styles.subtitulo}>
            {totalFavoritos} {totalFavoritos === 1 ? 'publicación guardada' : 'publicaciones guardadas'}
          </Text>
        </View>
      </View>

      <FlatList
        data={filas}
        keyExtractor={(fila) => fila.clave}
        renderItem={({ item }) => (
          <View style={styles.celda}>
            {item.publicacion ? <PublicacionCard publicacion={item.publicacion} /> : null}
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.fila}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => void cargarFavoritos(true)}
            tintColor={colors.navy}
          />
        }
        ListEmptyComponent={
          cargando ? (
            <Estado icono="heart-outline" titulo="Cargando favoritos…" />
          ) : error ? (
            <Estado
              icono="alert-circle-outline"
              titulo={error}
              esError
              accion={() => void cargarFavoritos()}
              textoAccion="Reintentar"
            />
          ) : (
            <Estado
              icono="heart-outline"
              titulo="Aún no tienes favoritos"
              mensaje="Guarda productos o servicios con el corazón para encontrarlos fácilmente aquí."
              accion={() => router.push('/buscar')}
              textoAccion="Explorar publicaciones"
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function Estado({
  icono,
  titulo,
  mensaje,
  esError = false,
  accion,
  textoAccion,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  titulo: string;
  mensaje?: string;
  esError?: boolean;
  accion?: () => void;
  textoAccion?: string;
}) {
  return (
    <View style={styles.estado}>
      <View style={styles.iconoEstado}>
        <MaterialCommunityIcons name={icono} size={30} color={esError ? colors.error : colors.gold} />
      </View>
      <Text style={[styles.estadoTitulo, esError && styles.estadoError]}>{titulo}</Text>
      {mensaje ? <Text style={styles.estadoMensaje}>{mensaje}</Text> : null}
      {accion && textoAccion ? (
        <Pressable accessibilityRole="button" onPress={accion} style={styles.boton}>
          <Text style={styles.botonTexto}>{textoAccion}</Text>
        </Pressable>
      ) : null}
    </View>
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
    gap: spacing.padSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
  },
  volver: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  barraTexto: { flex: 1 },
  titulo: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  subtitulo: { color: colors.muted, fontSize: 12, marginTop: 1 },
  contenido: { gap: spacing.padMd, padding: spacing.padMd },
  fila: { gap: spacing.padSm },
  celda: { flex: 1 },
  estado: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    marginTop: spacing.padMd,
    padding: spacing.padLg,
  },
  iconoEstado: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  estadoTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  estadoError: { color: colors.error },
  estadoMensaje: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  boton: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    marginTop: spacing.padSm,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  botonTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
});
