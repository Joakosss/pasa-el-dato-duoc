import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { listarNotificaciones } from '@/lib/api/notificaciones';
import {
  listarPublicaciones,
  listarPublicacionesCercanas,
  type PublicacionPublica,
} from '@/lib/api/publicaciones';
import { PUBLICACIONES_DEMOSTRACION_MOMENTANEO } from '@/lib/feed/publicaciones-demostracion-momentaneo';
import {
  selectAccessToken,
  selectSesion,
  useSesionStore,
} from '@/stores/sesion-store';

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
  const accessToken = useSesionStore(selectAccessToken);
  const nombre = sesion?.nombreCompleto.trim().split(/\s+/)[0] ?? 'estudiante';
  const [publicaciones, setPublicaciones] = useState<PublicacionPublica[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [cargandoCercanas, setCargandoCercanas] = useState(false);
  const [mostrandoCercanas, setMostrandoCercanas] = useState(false);
  const [modalUbicacionAbierto, setModalUbicacionAbierto] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const ubicacionActualRef = useRef<{ latitud: number; longitud: number } | null>(
    null,
  );

  const cargarPublicaciones = useCallback(async (esActualizacion = false) => {
    if (esActualizacion) setActualizando(true);
    else setCargando(true);

    setError(undefined);
    try {
      const [publicacionesRespuesta, categoriasRespuesta] = await Promise.all([
        listarPublicaciones(),
        listarCategorias(),
      ]);
      setPublicaciones([
        ...PUBLICACIONES_DEMOSTRACION_MOMENTANEO,
        ...publicacionesRespuesta,
      ]);
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
      if (!mostrandoCercanas) void cargarPublicaciones();
    }, [cargarPublicaciones, mostrandoCercanas]),
  );

  const abrirSolicitudUbicacion = () => {
    if (!cargandoCercanas) setModalUbicacionAbierto(true);
  };

  const cargarPublicacionesCercanas = async () => {
    if (cargandoCercanas) return;

    setCargandoCercanas(true);
    setError(undefined);

    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (!permiso.granted) {
        setError(
          'Necesitamos tu ubicación para mostrar publicaciones cercanas. No guardamos tu ubicación.',
        );
        return;
      }

      const posicionActual = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<null>((resolver) => {
          setTimeout(() => resolver(null), 8000);
        }),
      ]);

      let ubicacion = posicionActual
        ? {
            latitud: posicionActual.coords.latitude,
            longitud: posicionActual.coords.longitude,
          }
        : null;

      if (!ubicacion) {
        const ultimaUbicacion = await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60 * 1000,
          requiredAccuracy: 5000,
        });

        if (ultimaUbicacion) {
          ubicacion = {
            latitud: ultimaUbicacion.coords.latitude,
            longitud: ultimaUbicacion.coords.longitude,
          };
        }
      }

      if (!ubicacion) {
        ubicacion = ubicacionActualRef.current;
      }

      if (!ubicacion) {
        setError(
          'No pudimos determinar tu ubicación. Activa la ubicación del dispositivo e inténtalo nuevamente.',
        );
        return;
      }

      ubicacionActualRef.current = ubicacion;
      const respuesta = await listarPublicacionesCercanas(
        ubicacion.latitud,
        ubicacion.longitud,
      );

      setPublicaciones(respuesta);
      setMostrandoCercanas(true);
    } catch {
      setError(
        'No pudimos obtener tu ubicación. Revisa que la ubicación esté activada e inténtalo nuevamente.',
      );
    } finally {
      setCargandoCercanas(false);
    }
  };

  const mostrarTodas = () => {
    setMostrandoCercanas(false);
    void cargarPublicaciones();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BarraSuperior nombre={nombre} accessToken={accessToken} />

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
            refreshing={actualizando || cargandoCercanas}
            onRefresh={() =>
              mostrandoCercanas
                ? void cargarPublicacionesCercanas()
                : void cargarPublicaciones(true)
            }
            tintColor={colors.navy}
          />
        }
        ListHeaderComponent={
          <CabeceraFeed
            categorias={categorias}
            cargandoCercanas={cargandoCercanas}
            mostrandoCercanas={mostrandoCercanas}
            errorUbicacion={error}
            onCargarCercanas={abrirSolicitudUbicacion}
            onMostrarTodas={mostrarTodas}
          />
        }
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

      <Modal
        visible={modalUbicacionAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalUbicacionAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalUbicacion}>
            <View style={styles.iconoUbicacion}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={33} color={colors.gold} />
            </View>
            <Text style={styles.modalUbicacionTitulo}>Publicaciones cerca de ti</Text>
            <Text style={styles.modalUbicacionTexto}>
              Usaremos tu ubicación actual para ordenar publicaciones de sedes cercanas.
            </Text>
            <View style={styles.privacidadUbicacion}>
              <MaterialCommunityIcons name="shield-check-outline" size={17} color={colors.navy} />
              <Text style={styles.privacidadUbicacionTexto}>
                Tu ubicación no se guarda ni se comparte.
              </Text>
            </View>
            <View style={styles.accionesModalUbicacion}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setModalUbicacionAbierto(false)}
                style={styles.botonCancelarUbicacion}>
                <Text style={styles.botonCancelarUbicacionTexto}>Ahora no</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setModalUbicacionAbierto(false);
                  void cargarPublicacionesCercanas();
                }}
                style={styles.botonContinuarUbicacion}>
                <Text style={styles.botonContinuarUbicacionTexto}>Continuar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Barra fija: marca, saludo personalizado y acceso al perfil.
function BarraSuperior({
  nombre,
  accessToken,
}: {
  nombre: string;
  accessToken: string | null;
}) {
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  const cargarNoLeidas = useCallback(async () => {
    if (!accessToken) {
      setNotificacionesNoLeidas(0);
      return;
    }

    try {
      const respuesta = await listarNotificaciones(accessToken);
      setNotificacionesNoLeidas(
        respuesta.items.filter((notificacion) => !notificacion.leida).length,
      );
    } catch {
      // Conserva el contador ante un error temporal de red.
    }
  }, [accessToken]);

  useEffect(() => {
    void cargarNoLeidas();
    const intervalo = setInterval(() => void cargarNoLeidas(), 10_000);
    return () => clearInterval(intervalo);
  }, [cargarNoLeidas]);

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

      <View style={styles.accionesBarra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver notificaciones"
          onPress={() => router.push('/notificaciones')}
          style={({ pressed }) => [styles.botonNotificaciones, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="bell-outline" size={21} color={colors.navy} />
          {notificacionesNoLeidas > 0 ? (
            <View style={styles.badgeNotificaciones}>
              <Text style={styles.badgeNotificacionesTexto}>
                {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a mi perfil"
          onPress={() => router.push('/perfil')}
          style={({ pressed }) => [styles.avatarBoton, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="account" size={20} color={colors.navy} />
        </Pressable>
      </View>
    </View>
  );
}

// Contenido que viaja con el scroll: buscador, anuncio, categorías y título.
function CabeceraFeed({
  categorias,
  cargandoCercanas,
  mostrandoCercanas,
  errorUbicacion,
  onCargarCercanas,
  onMostrarTodas,
}: {
  categorias: CategoriaCatalogo[];
  cargandoCercanas: boolean;
  mostrandoCercanas: boolean;
  errorUbicacion?: string;
  onCargarCercanas: () => void;
  onMostrarTodas: () => void;
}) {
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

      {errorUbicacion ? (
        <View style={styles.avisoUbicacion}>
          <MaterialCommunityIcons name="map-marker-alert-outline" size={18} color={colors.error} />
          <Text style={styles.avisoUbicacionTexto}>{errorUbicacion}</Text>
        </View>
      ) : null}

      <View style={styles.seccionBarra}>
        <Text style={styles.seccionTitulo}>
          {mostrandoCercanas ? 'Publicaciones cerca de ti' : 'Productos para ti'}
        </Text>
        {mostrandoCercanas ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todas las publicaciones"
            onPress={onMostrarTodas}
            style={({ pressed }) => [styles.verTodo, pressed && styles.pressed]}>
            <Text style={styles.verTodoTexto}>Ver todo</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: cargandoCercanas }}
            disabled={cargandoCercanas}
            onPress={onCargarCercanas}
            style={({ pressed }) => [
              styles.cercaDeTi,
              cargandoCercanas && styles.deshabilitado,
              pressed && styles.pressed,
            ]}>
            {cargandoCercanas ? (
              <ActivityIndicator color={colors.navy} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="crosshairs-gps" size={15} color={colors.navy} />
                <Text style={styles.cercaDeTiTexto}>Cerca de ti</Text>
              </>
            )}
          </Pressable>
        )}
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
  accionesBarra: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  botonNotificaciones: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    position: 'relative',
    width: 38,
  },
  badgeNotificaciones: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -5,
    top: -5,
  },
  badgeNotificacionesTexto: { color: colors.card, fontSize: 9, fontWeight: '800' },
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
  cercaDeTi: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: spacing.padMd,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  cercaDeTiTexto: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  deshabilitado: { opacity: 0.65 },
  avisoUbicacion: {
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: colors.error,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.padMd,
    padding: spacing.padSm,
  },
  avisoUbicacionTexto: { color: colors.error, flex: 1, fontSize: 12, lineHeight: 17 },
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
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,43,73,0.58)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  modalUbicacion: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    maxWidth: 380,
    padding: spacing.padLg,
    width: '100%',
  },
  iconoUbicacion: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  modalUbicacionTitulo: { color: colors.navy, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  modalUbicacionTexto: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  privacidadUbicacion: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#fff8dc',
    borderColor: colors.gold,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    padding: spacing.padSm,
  },
  privacidadUbicacionTexto: { color: colors.navy, flex: 1, fontSize: 12, lineHeight: 17 },
  accionesModalUbicacion: { flexDirection: 'row', gap: spacing.padSm, marginTop: spacing.padSm, width: '100%' },
  botonCancelarUbicacion: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonCancelarUbicacionTexto: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  botonContinuarUbicacion: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonContinuarUbicacionTexto: { color: colors.navy, fontSize: 14, fontWeight: '800' },
});
