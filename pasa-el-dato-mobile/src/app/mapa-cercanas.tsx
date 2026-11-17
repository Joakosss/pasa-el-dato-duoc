import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { ApiError } from '@/lib/api';
import {
  listarPublicacionesCercanas,
  resolverUrlImagen,
  type PublicacionPublica,
} from '@/lib/api/publicaciones';
import { colors, spacing } from '@/theme';

type ModuloMapbox = typeof import('@rnmapbox/maps');

const RADIOS_KM = [5, 10, 25, 50, 100] as const;
const ZOOM_INICIAL = 11;
const DISTANCIA_MINIMA_ACTUALIZACION_M = 250;
const ejecutandoEnExpoGo = Constants.executionEnvironment === 'storeClient';

function cargarMapbox(): ModuloMapbox | undefined {
  if (ejecutandoEnExpoGo || !env.mapboxAccessToken) {
    return undefined;
  }

  try {
    return require('@rnmapbox/maps') as ModuloMapbox;
  } catch {
    return undefined;
  }
}

interface ReferenciaCamara {
  setCamera: (configuracion: {
    centerCoordinate: [number, number];
    zoomLevel: number;
    animationDuration: number;
  }) => void;
}

interface Ubicacion {
  latitud: number;
  longitud: number;
}

function distanciaEnMetros(origen: Ubicacion, destino: Ubicacion): number {
  const radioTierraM = 6_371_000;
  const aLatitud = ((destino.latitud - origen.latitud) * Math.PI) / 180;
  const aLongitud = ((destino.longitud - origen.longitud) * Math.PI) / 180;
  const latitudOrigen = (origen.latitud * Math.PI) / 180;
  const latitudDestino = (destino.latitud * Math.PI) / 180;

  const valor =
    Math.sin(aLatitud / 2) ** 2 +
    Math.cos(latitudOrigen) * Math.cos(latitudDestino) * Math.sin(aLongitud / 2) ** 2;

  return 2 * radioTierraM * Math.atan2(Math.sqrt(valor), Math.sqrt(1 - valor));
}

interface SedeConPublicaciones {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  publicaciones: PublicacionPublica[];
  distanciaKm: number;
}

export default function MapaCercanasScreen() {
  const mapbox = useMemo(cargarMapbox, []);
  const camaraRef = useRef<ReferenciaCamara | null>(null);
  const [mapboxInicializado, setMapboxInicializado] = useState(false);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [radioKm, setRadioKm] = useState<(typeof RADIOS_KM)[number]>(25);
  const [publicaciones, setPublicaciones] = useState<PublicacionPublica[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<SedeConPublicaciones | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [imagenesMarcadorCargadas, setImagenesMarcadorCargadas] = useState<Set<string>>(
    () => new Set(),
  );
  const ultimaUbicacionConsultadaRef = useRef<Ubicacion | null>(null);

  const sedes = useMemo(() => agruparPorSede(publicaciones), [publicaciones]);

  useEffect(() => {
    if (!mapbox || !env.mapboxAccessToken) return;

    let activo = true;

    void mapbox.default.setAccessToken(env.mapboxAccessToken).then(() => {
      if (activo) setMapboxInicializado(true);
    });

    return () => {
      activo = false;
    };
  }, [mapbox]);

  const cargarMapa = useCallback(async () => {
    setCargando(true);
    setError(undefined);

    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (!permiso.granted) {
        setError(
          'Necesitamos tu ubicación para mostrar las sedes dentro del rango seleccionado. Tu ubicación no se guarda.',
        );
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nuevaUbicacion = {
        latitud: posicion.coords.latitude,
        longitud: posicion.coords.longitude,
      };

      setUbicacion(nuevaUbicacion);
      ultimaUbicacionConsultadaRef.current = nuevaUbicacion;
      const respuesta = await listarPublicacionesCercanas(
        nuevaUbicacion.latitud,
        nuevaUbicacion.longitud,
        radioKm,
      );
      setPublicaciones(respuesta);
      setSedeSeleccionada(null);
    } catch (causa: unknown) {
      setError(
        causa instanceof ApiError
          ? causa.message
          : 'No pudimos cargar el mapa. Revisa tu conexión y que la ubicación esté activada.',
      );
    } finally {
      setCargando(false);
    }
  }, [radioKm]);

  useEffect(() => {
    const solicitud = setTimeout(() => {
      void cargarMapa();
    }, 0);

    return () => clearTimeout(solicitud);
  }, [cargarMapa]);

  useEffect(() => {
    let activo = true;
    let suscripcion: Location.LocationSubscription | undefined;

    void (async () => {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (!permiso.granted || !activo) return;

      suscripcion = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 20,
          timeInterval: 10_000,
        },
        (posicion) => {
          const nuevaUbicacion = {
            latitud: posicion.coords.latitude,
            longitud: posicion.coords.longitude,
          };

          setUbicacion(nuevaUbicacion);

          const ubicacionConsultada = ultimaUbicacionConsultadaRef.current;
          if (
            ubicacionConsultada &&
            distanciaEnMetros(ubicacionConsultada, nuevaUbicacion) >= DISTANCIA_MINIMA_ACTUALIZACION_M
          ) {
            void cargarMapa();
          }
        },
      );
    })();

    return () => {
      activo = false;
      suscripcion?.remove();
    };
  }, [cargarMapa]);

  const cambiarRadio = (nuevoRadio: (typeof RADIOS_KM)[number]) => {
    if (nuevoRadio === radioKm) return;
    setRadioKm(nuevoRadio);
  };

  const centrarEnUsuario = () => {
    if (!ubicacion) return;
    camaraRef.current?.setCamera({
      centerCoordinate: [ubicacion.longitud, ubicacion.latitud],
      zoomLevel: ZOOM_INICIAL,
      animationDuration: 550,
    });
  };

  if (!env.mapboxAccessToken || !mapbox) {
    return <EstadoConfiguracion requiereDevelopmentBuild={ejecutandoEnExpoGo} />;
  }

  if (!mapboxInicializado) {
    return (
      <SafeAreaView style={styles.estadoConfiguracion}>
        <ActivityIndicator color={colors.navy} size="large" />
        <Text style={styles.estadoConfiguracionTexto}>Preparando el mapa…</Text>
      </SafeAreaView>
    );
  }

  const {
    MapView,
    Camera,
    LocationPuck,
    PointAnnotation,
    StyleURL,
  } = mapbox.default;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio"
          onPress={() => router.back()}
          style={styles.botonIcono}>
          <MaterialCommunityIcons name="arrow-left" size={23} color={colors.navy} />
        </Pressable>
        <View style={styles.barraTexto}>
          <Text style={styles.titulo}>Cerca de ti</Text>
          <Text style={styles.subtitulo}>Sedes con publicaciones dentro de tu rango</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar ubicaciones cercanas"
          accessibilityState={{ busy: cargando }}
          disabled={cargando}
          onPress={() => void cargarMapa()}
          style={[styles.botonIcono, cargando && styles.deshabilitado]}>
          <MaterialCommunityIcons name="refresh" size={22} color={colors.navy} />
        </Pressable>
      </View>

      <View style={styles.panelRangos}>
        <View style={styles.rangosEncabezado}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color={colors.navy} />
          <Text style={styles.rangosTitulo}>Radio de búsqueda</Text>
          <Text style={styles.rangosValor}>{radioKm} km</Text>
        </View>
        <View style={styles.rangos}>
          {RADIOS_KM.map((radio) => (
            <Pressable
              key={radio}
              accessibilityRole="button"
              accessibilityState={{ selected: radio === radioKm }}
              onPress={() => cambiarRadio(radio)}
              style={[styles.chipRadio, radio === radioKm && styles.chipRadioActivo]}>
              <Text style={[styles.chipRadioTexto, radio === radioKm && styles.chipRadioTextoActivo]}>
                {radio} km
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.mapaContenedor}>
        {ubicacion ? (
          <MapView style={styles.mapa} styleURL={StyleURL.Street}>
            <Camera
              ref={camaraRef as never}
              centerCoordinate={[ubicacion.longitud, ubicacion.latitud]}
              zoomLevel={ZOOM_INICIAL}
            />
            <LocationPuck puckBearingEnabled puckBearing="heading" pulsing={{ isEnabled: true }} />
            {sedes.map((sede) => {
              const sedeEstaSeleccionada = sedeSeleccionada?.id === sede.id;
              const portada = sede.publicaciones
                .flatMap((publicacion) => publicacion.imagenes)
                .slice()
                .sort((primera, segunda) => primera.orden - segunda.orden)[0];

              return (
                <PointAnnotation
                  key={[
                    'sede',
                    sede.id,
                    sedeSeleccionada?.id ?? 'ninguna',
                    portada && imagenesMarcadorCargadas.has(portada.url) ? 'imagen-lista' : 'imagen-cargando',
                  ].join('-')}
                  id={`sede-${sede.id}`}
                  coordinate={[sede.longitud, sede.latitud]}
                  onSelected={() => setSedeSeleccionada(sede)}>
                  <View style={[styles.marcador, sedeEstaSeleccionada && styles.marcadorSeleccionado]}>
                    <View
                      style={[
                        styles.marcadorPunta,
                        sedeEstaSeleccionada && styles.marcadorPuntaSeleccionado,
                      ]}
                    />
                    <View
                      style={[
                        styles.marcadorMiniatura,
                        sedeEstaSeleccionada && styles.marcadorMiniaturaSeleccionado,
                      ]}>
                      {portada ? (
                        <Image
                          source={{ uri: resolverUrlImagen(portada.url) }}
                          onLoad={() =>
                            setImagenesMarcadorCargadas((anteriores) => {
                              if (anteriores.has(portada.url)) return anteriores;
                              return new Set(anteriores).add(portada.url);
                            })
                          }
                          style={styles.marcadorImagen}
                        />
                      ) : (
                        <MaterialCommunityIcons name="storefront-outline" size={25} color={colors.navy} />
                      )}
                    </View>
                    <View style={styles.marcadorCantidad}>
                      <Text style={styles.marcadorCantidadTexto}>{sede.publicaciones.length}</Text>
                    </View>
                  </View>
                </PointAnnotation>
              );
            })}
          </MapView>
        ) : (
          <View style={styles.mapaVacio}>
            {cargando ? (
              <ActivityIndicator color={colors.navy} size="large" />
            ) : (
              <MaterialCommunityIcons name="map-marker-alert-outline" size={36} color={colors.error} />
            )}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Centrar mapa en mi ubicación"
          disabled={!ubicacion}
          onPress={centrarEnUsuario}
          style={[styles.botonCentrar, !ubicacion && styles.deshabilitado]}>
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.navy} />
        </Pressable>

        {cargando && ubicacion ? (
          <View style={styles.cargandoMapa}>
            <ActivityIndicator color={colors.navy} size="small" />
            <Text style={styles.cargandoMapaTexto}>Buscando publicaciones…</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorCaja}>
          <MaterialCommunityIcons name="alert-circle-outline" size={19} color={colors.error} />
          <Text style={styles.errorTexto}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void cargarMapa()}>
            <Text style={styles.errorReintentar}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!cargando && !error ? (
        <Text style={styles.resumen}>
          {publicaciones.length} {publicaciones.length === 1 ? 'publicación' : 'publicaciones'} en{' '}
          {sedes.length} {sedes.length === 1 ? 'sede' : 'sedes'} dentro de {radioKm} km.
        </Text>
      ) : null}

      {sedeSeleccionada ? (
        <View style={styles.tarjetaSede}>
          <View style={styles.tarjetaEncabezado}>
            <View style={styles.tarjetaIcono}>
              <MaterialCommunityIcons name="storefront-outline" size={21} color={colors.gold} />
            </View>
            <View style={styles.tarjetaTexto}>
              <Text style={styles.sedeNombre} numberOfLines={1}>{sedeSeleccionada.nombre}</Text>
              <Text style={styles.sedeDetalle}>
                A {sedeSeleccionada.distanciaKm.toFixed(1)} km · {sedeSeleccionada.publicaciones.length}{' '}
                {sedeSeleccionada.publicaciones.length === 1 ? 'publicación' : 'publicaciones'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar detalle de sede"
              onPress={() => setSedeSeleccionada(null)}
              style={styles.cerrarTarjeta}>
              <MaterialCommunityIcons name="close" size={20} color={colors.navy} />
            </Pressable>
          </View>
          {sedeSeleccionada.publicaciones.slice(0, 2).map((publicacion) => (
            <Pressable
              key={publicacion.id}
              accessibilityRole="button"
              onPress={() => router.push(`/producto/${publicacion.id}`)}
              style={styles.filaPublicacion}>
              <Text numberOfLines={1} style={styles.publicacionTitulo}>{publicacion.titulo}</Text>
              <MaterialCommunityIcons name="chevron-right" size={19} color={colors.navy} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function agruparPorSede(publicaciones: PublicacionPublica[]): SedeConPublicaciones[] {
  const sedes = new Map<number, SedeConPublicaciones>();

  for (const publicacion of publicaciones) {
    const { sede } = publicacion;
    if (sede.latitud === undefined || sede.longitud === undefined) continue;

    const existente = sedes.get(sede.id);
    if (existente) {
      existente.publicaciones.push(publicacion);
      existente.distanciaKm = Math.min(existente.distanciaKm, publicacion.distanciaKm ?? Infinity);
      continue;
    }

    sedes.set(sede.id, {
      id: sede.id,
      nombre: sede.nombre,
      latitud: sede.latitud,
      longitud: sede.longitud,
      publicaciones: [publicacion],
      distanciaKm: publicacion.distanciaKm ?? Infinity,
    });
  }

  return [...sedes.values()].sort((primera, segunda) => primera.distanciaKm - segunda.distanciaKm);
}

function EstadoConfiguracion({
  requiereDevelopmentBuild,
}: {
  requiereDevelopmentBuild: boolean;
}) {
  return (
    <SafeAreaView style={styles.estadoConfiguracion}>
      <MaterialCommunityIcons name="map-marker-alert-outline" size={38} color={colors.error} />
      <Text style={styles.estadoConfiguracionTitulo}>
        {requiereDevelopmentBuild ? 'Mapa disponible en development build' : 'Mapa no configurado'}
      </Text>
      <Text style={styles.estadoConfiguracionTexto}>
        {requiereDevelopmentBuild
          ? 'Mapbox no funciona dentro de Expo Go. Abre esta app con un development build para usar el mapa.'
          : 'Falta configurar EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN en el entorno de la aplicación.'}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.botonVolver}>
        <Text style={styles.botonVolverTexto}>Volver</Text>
      </Pressable>
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
    gap: spacing.padSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
  },
  botonIcono: { alignItems: 'center', height: 38, justifyContent: 'center', width: 38 },
  barraTexto: { flex: 1 },
  titulo: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  subtitulo: { color: colors.muted, fontSize: 11, marginTop: 1 },
  panelRangos: {
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.padSm,
    paddingHorizontal: spacing.padMd,
    paddingTop: 10,
  },
  rangosEncabezado: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 9,
  },
  rangosTitulo: { color: colors.navy, flex: 1, fontSize: 12, fontWeight: '800' },
  rangosValor: {
    backgroundColor: '#eef6fb',
    borderRadius: 999,
    color: colors.navy,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  rangos: {
    flexDirection: 'row',
    gap: 7,
  },
  chipRadio: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 6,
  },
  chipRadioActivo: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    elevation: 2,
  },
  chipRadioTexto: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  chipRadioTextoActivo: { fontWeight: '900' },
  mapaContenedor: { flex: 1, position: 'relative' },
  mapa: { flex: 1 },
  mapaVacio: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  marcador: {
    alignItems: 'center',
    height: 66,
    justifyContent: 'flex-start',
    paddingTop: 2,
    position: 'relative',
    width: 60,
  },
  marcadorPunta: {
    backgroundColor: colors.navy,
    bottom: 3,
    height: 17,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 17,
  },
  marcadorPuntaSeleccionado: { backgroundColor: colors.gold },
  marcadorMiniatura: {
    alignItems: 'center',
    backgroundColor: '#eef6fb',
    borderColor: colors.navy,
    borderRadius: 26,
    borderWidth: 4,
    elevation: 5,
    height: 52,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 52,
    zIndex: 1,
  },
  marcadorSeleccionado: {
    transform: [{ scale: 1.12 }],
  },
  marcadorMiniaturaSeleccionado: {
    borderColor: colors.gold,
    borderWidth: 5,
    elevation: 9,
  },
  marcadorImagen: { height: '100%', width: '100%' },
  marcadorCantidad: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: colors.navy,
    borderRadius: 11,
    borderWidth: 2,
    elevation: 7,
    height: 23,
    justifyContent: 'center',
    minWidth: 23,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  marcadorCantidadTexto: { color: colors.navy, fontSize: 11, fontWeight: '900' },
  botonCentrar: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    bottom: spacing.padMd,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.padMd,
    width: 44,
  },
  cargandoMapa: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    left: spacing.padMd,
    padding: 9,
    position: 'absolute',
    top: spacing.padMd,
  },
  cargandoMapaTexto: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  errorCaja: {
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: colors.error,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.padSm,
  },
  errorTexto: { color: colors.error, flex: 1, fontSize: 12, lineHeight: 17 },
  errorReintentar: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  resumen: {
    backgroundColor: colors.card,
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
    textAlign: 'center',
  },
  tarjetaSede: {
    backgroundColor: colors.card,
    borderColor: colors.gold,
    borderTopWidth: 3,
    elevation: 10,
    gap: 7,
    padding: spacing.padMd,
  },
  tarjetaEncabezado: { alignItems: 'center', flexDirection: 'row', gap: spacing.padSm },
  tarjetaIcono: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  tarjetaTexto: { flex: 1 },
  sedeNombre: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  sedeDetalle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  cerrarTarjeta: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  filaPublicacion: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
    paddingLeft: 48,
  },
  publicacionTitulo: { color: colors.navy, flex: 1, fontSize: 13, fontWeight: '600' },
  estadoConfiguracion: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: spacing.padSm,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  estadoConfiguracionTitulo: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  estadoConfiguracionTexto: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  botonVolver: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    marginTop: spacing.padSm,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padLg,
  },
  botonVolverTexto: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  deshabilitado: { opacity: 0.55 },
});
