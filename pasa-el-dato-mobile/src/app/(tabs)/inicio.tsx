import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openBrowserAsync } from 'expo-web-browser';

import { colors, spacing } from '@/theme';
import { PublicacionCard } from '@/components/feed/PublicacionCard';
import { ApiError } from '@/lib/api';
import { listarCategorias, type CategoriaCatalogo } from '@/lib/api/catalogos';
import {
  listarPublicaciones,
  type PublicacionPublica,
} from '@/lib/api/publicaciones';
import { selectSesion, useSesionStore } from '@/stores/sesion-store';

// Aviso institucional: mismo contenido y destino que el bloque web.
const ANUNCIO = {
  titulo: 'Anuncios Duoc',
  mensaje: 'Revisa las novedades de la comunidad',
  boton: 'Ver más',
  url: 'https://www.duoc.cl/noticias/',
} as const;

// Inicio: feed de marketplace. Cabecera con saludo, buscador y anuncio
// institucional; luego categorías y la grilla de publicaciones.
export default function InicioScreen() {
  const sesion = useSesionStore(selectSesion);
  const nombre = sesion?.nombreCompleto.trim().split(/\s+/)[0] ?? 'estudiante';
  const [publicaciones, setPublicaciones] = useState<PublicacionPublica[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const cargarPublicaciones = useCallback(async (esActualizacion = false) => {
    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError(undefined);
    try {
      const [publicacionesRespuesta, categoriasRespuesta] = await Promise.all([
        listarPublicaciones(),
        listarCategorias(),
      ]);
      setPublicaciones(publicacionesRespuesta);
      setCategorias(categoriasRespuesta);
    } catch (causa: unknown) {
      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos cargar las publicaciones. Reintenta.',
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarPublicaciones();
    }, [cargarPublicaciones]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BarraSuperior nombre={nombre} />

      <FlatList
        data={publicaciones}
        keyExtractor={(publicacion) => publicacion.id}
        renderItem={({ item }) => (
          <View style={styles.celda}>
            <PublicacionCard publicacion={item} />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.fila}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => void cargarPublicaciones(true)}
            tintColor={colors.navy}
          />
        }
        ListHeaderComponent={<CabeceraFeed categorias={categorias} />}
        ListEmptyComponent={
          cargando ? (
            <View style={styles.estadoLista}>
              <ActivityIndicator color={colors.navy} />
              <Text style={styles.estadoListaTexto}>Cargando publicaciones…</Text>
            </View>
          ) : error ? (
            <View style={styles.estadoLista}>
              <Text style={styles.errorLista}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void cargarPublicaciones()}
                style={styles.reintentar}>
                <Text style={styles.reintentarTexto}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.estadoLista}>
              <MaterialCommunityIcons name="package-variant-closed" size={30} color={colors.gold} />
              <Text style={styles.estadoListaTitulo}>Aún no hay publicaciones</Text>
              <Text style={styles.estadoListaTexto}>
                Sé la primera persona en publicar algo para la comunidad.
              </Text>
            </View>
          )
        }
        ListFooterComponent={<PieFeed />}
      />
    </SafeAreaView>
  );
}

// Barra fija: marca, saludo personalizado y acceso al perfil.
function BarraSuperior({ nombre }: { nombre: string }) {
  return (
    <View style={styles.barra}>
      <View style={styles.marca}>
        <View style={styles.logo}>
          <Text style={styles.logoTexto}>PD</Text>
        </View>
        <View style={styles.saludoCaja}>
          <Text style={styles.saludo} numberOfLines={1}>
            Hola, {nombre}
          </Text>
          <Text style={styles.saludoSub} numberOfLines={1}>
            ¿Qué estás buscando hoy?
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ir a mi perfil"
        onPress={() => router.push('/perfil')}
        style={({ pressed }) => [styles.avatarBoton, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="account" size={20} color={colors.navy} />
      </Pressable>
    </View>
  );
}

// Contenido que viaja con el scroll: buscador, anuncio, categorías y título.
function CabeceraFeed({ categorias }: { categorias: CategoriaCatalogo[] }) {
  return (
    <View>
      <View style={styles.busqueda}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar publicaciones"
          onPress={() => router.push('/buscar')}
          style={({ pressed }) => [styles.buscador, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />
          <Text style={styles.buscadorTexto} numberOfLines={1}>
            Buscar libros, electrónica, servicios...
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filtros de búsqueda"
          onPress={() =>
            router.push({
              pathname: '/buscar',
              params: { filtros: '1' },
            })
          }
          style={({ pressed }) => [styles.filtro, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="tune-variant" size={18} color={colors.gold} />
        </Pressable>
      </View>

      <View style={styles.anuncio}>
        <Text style={styles.anuncioTitulo}>{ANUNCIO.titulo}</Text>
        <Text style={styles.anuncioMensaje}>{ANUNCIO.mensaje}</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={ANUNCIO.boton}
          onPress={() => {
            void openBrowserAsync(ANUNCIO.url);
          }}
          style={({ pressed }) => [styles.anuncioBoton, pressed && styles.pressed]}>
          <Text style={styles.anuncioBotonTexto}>{ANUNCIO.boton}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.navy} />
        </Pressable>
      </View>

      <Text style={styles.seccionTitulo}>Explora por categoría</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categorias}>
        {categorias.map((categoria) => (
          <Pressable
            key={categoria.id}
            accessibilityRole="button"
            accessibilityLabel={`Categoría ${categoria.nombre}`}
            onPress={() =>
              router.push({
                pathname: '/buscar',
                params: { categoriaId: String(categoria.id) },
              })
            }
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="tag-outline" size={15} color={colors.navy} />
            <Text style={styles.chipTexto}>{categoria.nombre}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.seccionBarra}>
        <Text style={styles.seccionTitulo}>Productos para ti</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver todas las publicaciones"
          onPress={() => router.push('/buscar')}
          style={({ pressed }) => [styles.verTodo, pressed && styles.pressed]}>
          <Text style={styles.verTodoTexto}>Ver todo</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={colors.navy} />
        </Pressable>
      </View>
    </View>
  );
}

// Cierre del feed: invitación a publicar.
function PieFeed() {
  return (
    <View style={styles.cta}>
      <Text style={styles.ctaTitulo}>¿Tienes algo que vender?</Text>
      <Text style={styles.ctaSub}>
        Publica y llega a toda la comunidad Duoc.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Publicar una publicación"
        onPress={() => router.push('/publicar')}
        style={({ pressed }) => [styles.ctaBoton, pressed && styles.pressed]}>
        <MaterialCommunityIcons name="plus" size={16} color={colors.gold} />
        <Text style={styles.ctaBotonTexto}>Publicar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.padSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTexto: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '800',
  },
  saludoCaja: {
    flexShrink: 1,
  },
  saludo: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  saludoSub: {
    color: colors.muted,
    fontSize: 12,
  },
  avatarBoton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padMd,
    paddingBottom: spacing.padLg,
    gap: spacing.padMd,
  },
  fila: {
    gap: spacing.padSm,
  },
  celda: {
    flex: 1,
  },
  busqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buscador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padSm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
  },
  buscadorTexto: {
    color: colors.muted,
    fontSize: 13,
    flexShrink: 1,
  },
  filtro: {
    width: spacing.touchMin,
    height: spacing.touchMin,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anuncio: {
    backgroundColor: colors.navy,
    borderRadius: spacing.radiusLg,
    padding: spacing.padMd,
    marginTop: spacing.padSm,
  },
  anuncioTitulo: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '700',
  },
  anuncioMensaje: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  anuncioBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    minHeight: 36,
    paddingHorizontal: 14,
    marginTop: 10,
    backgroundColor: colors.gold,
    borderRadius: 10,
  },
  anuncioBotonTexto: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  seccionTitulo: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.padMd,
  },
  categorias: {
    gap: 8,
    paddingTop: spacing.padSm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: spacing.padSm,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
  },
  chipTexto: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '600',
  },
  seccionBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verTodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingLeft: 8,
    marginTop: spacing.padMd,
  },
  verTodoTexto: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusLg,
    padding: spacing.padMd,
    marginTop: spacing.padSm,
  },
  ctaTitulo: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '800',
  },
  ctaSub: {
    color: 'rgba(0, 43, 73, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  ctaBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing.padMd,
    marginTop: 12,
    backgroundColor: colors.navy,
    borderRadius: 10,
  },
  ctaBotonTexto: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  estadoLista: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    marginTop: spacing.padMd,
    padding: spacing.padLg,
  },
  estadoListaTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  estadoListaTexto: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  errorLista: { color: colors.error, fontSize: 13, textAlign: 'center' },
  reintentar: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.padMd,
  },
  reintentarTexto: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  pressed: {
    opacity: 0.9,
  },
});
