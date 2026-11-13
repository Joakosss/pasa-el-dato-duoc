import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
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

import { SelectorImagenes, type ImagenVistaPrevia } from '@/components/publicar/SelectorImagenes';
import { ApiError } from '@/lib/api';
import {
  type CatalogoBasico,
  type SedeCatalogo,
  listarCategorias,
  listarSedes,
  listarTiposVenta,
} from '@/lib/api/catalogos';
import { crearPublicacion, type ImagenSeleccionadaPublicacion } from '@/lib/api/publicaciones';
import {
  DESCRIPCION_MAX,
  formatearPrecioClp,
  hayErrores,
  IMAGENES_MAX,
  PESO_MAX_IMAGEN_MB,
  precioEnClp,
  TITULO_MAX,
  validarFormularioPublicacion,
  type CampoPublicacion,
  type ErroresPublicacion,
} from '@/lib/validators/publicacion';
import { selectAccessToken, selectSesion, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

interface ImagenFormulario extends ImagenVistaPrevia {
  nombre: string;
  mimeType: string;
}

interface OpcionCatalogo {
  id: number;
  nombre: string;
}

type SelectorActivo = 'categoria' | 'tipoVenta' | 'sede' | null;

function mensajeError(error: unknown, respaldo: string): string {
  if (error instanceof ApiError) return error.message || respaldo;
  if (error instanceof Error && error.message.trim()) return error.message;

  return respaldo;
}

function nombreArchivo(uri: string, indice: number): string {
  const ultimoSegmento = uri.split('/').pop();
  return ultimoSegmento || `imagen-${Date.now()}-${indice}.jpg`;
}

function mimeTypeImagen(uri: string, mimeType: string | null | undefined): string {
  if (mimeType) return mimeType;
  if (/\.png$/i.test(uri)) return 'image/png';
  if (/\.webp$/i.test(uri)) return 'image/webp';
  return 'image/jpeg';
}

function SelectorCatalogoModal({
  visible,
  titulo,
  opciones,
  cargando,
  error,
  onCerrar,
  onReintentar,
  onSeleccionar,
}: {
  visible: boolean;
  titulo: string;
  opciones: OpcionCatalogo[];
  cargando: boolean;
  error?: string;
  onCerrar: () => void;
  onReintentar: () => void;
  onSeleccionar: (id: number) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <View style={styles.modalSelector}>
          <Text style={styles.modalTitulo}>{titulo}</Text>
          {cargando ? (
            <View style={styles.estadoCatalogo}>
              <ActivityIndicator color={colors.navy} />
              <Text style={styles.ayuda}>Cargando opciones…</Text>
            </View>
          ) : error ? (
            <View style={styles.estadoCatalogo}>
              <Text style={styles.error}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={onReintentar} style={styles.botonReintentar}>
                <Text style={styles.botonReintentarTexto}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={styles.listaCatalogo} showsVerticalScrollIndicator={false}>
              {opciones.map((opcion) => (
                <Pressable
                  key={opcion.id}
                  accessibilityRole="button"
                  onPress={() => onSeleccionar(opcion.id)}
                  style={styles.opcionCatalogo}>
                  <Text style={styles.opcionCatalogoTexto}>{opcion.nombre}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Pressable accessibilityRole="button" onPress={onCerrar} style={styles.cerrarSelector}>
            <Text style={styles.cerrarSelectorTexto}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function PublicarScreen() {
  const { origen } = useLocalSearchParams<{ origen?: string }>();
  const accessToken = useSesionStore(selectAccessToken);
  const sesion = useSesionStore(selectSesion);
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const scroll = useRef<ScrollView>(null);

  const [imagenes, setImagenes] = useState<ImagenFormulario[]>([]);
  const [titulo, setTitulo] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>();
  const [tipoVentaId, setTipoVentaId] = useState<number | undefined>();
  const [sedeId, setSedeId] = useState<number | undefined>();
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<ErroresPublicacion>({});
  const [categorias, setCategorias] = useState<CatalogoBasico[]>([]);
  const [tiposVenta, setTiposVenta] = useState<CatalogoBasico[]>([]);
  const [sedes, setSedes] = useState<SedeCatalogo[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState<string | undefined>();
  const [selectorActivo, setSelectorActivo] = useState<SelectorActivo>(null);
  const [publicando, setPublicando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | undefined>();
  const [publicacionExitosa, setPublicacionExitosa] = useState(false);
  const [publicacionCreadaId, setPublicacionCreadaId] = useState<string | undefined>();

  const cargarCatalogos = async () => {
    setCargandoCatalogos(true);
    setErrorCatalogos(undefined);

    try {
      const [categoriasRespuesta, tiposRespuesta, sedesRespuesta] = await Promise.all([
        listarCategorias(),
        listarTiposVenta(),
        listarSedes(),
      ]);
      setCategorias(categoriasRespuesta);
      setTiposVenta(tiposRespuesta);
      setSedes(sedesRespuesta);
      setSedeId((actual) => actual ?? sedesRespuesta[0]?.id);
    } catch (error: unknown) {
      setErrorCatalogos(mensajeError(error, 'No pudimos cargar los catálogos.'));
    } finally {
      setCargandoCatalogos(false);
    }
  };

  useEffect(() => {
    const solicitud = setTimeout(() => {
      void cargarCatalogos();
    }, 0);

    return () => clearTimeout(solicitud);
  }, []);

  const limpiarError = (campo: CampoPublicacion) => {
    setErrores((previos) =>
      previos[campo] ? { ...previos, [campo]: undefined } : previos,
    );
  };

  const agregarImagenesSeleccionadas = (
    assets: readonly ImagePicker.ImagePickerAsset[],
  ) => {
    const imagenMuyPesada = assets.find(
      (asset) =>
        asset.fileSize !== null &&
        asset.fileSize !== undefined &&
        asset.fileSize > PESO_MAX_IMAGEN_MB * 1024 * 1024,
    );

    if (imagenMuyPesada) {
      setErrores((previos) => ({
        ...previos,
        imagenes: `Cada imagen debe pesar como máximo ${PESO_MAX_IMAGEN_MB} MB.`,
      }));
      return;
    }

    const nuevasImagenes: ImagenFormulario[] = assets.map((asset, indice) => ({
      id: `${asset.assetId ?? asset.uri}-${Date.now()}-${indice}`,
      uri: asset.uri,
      nombre: asset.fileName ?? nombreArchivo(asset.uri, indice),
      mimeType: mimeTypeImagen(asset.uri, asset.mimeType),
    }));

    setImagenes((previas) => [...previas, ...nuevasImagenes].slice(0, IMAGENES_MAX));
    limpiarError('imagenes');
  };

  const seleccionarDesdeGaleria = async () => {
    if (publicando || imagenes.length >= IMAGENES_MAX) return;

    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setErrores((previos) => ({
        ...previos,
        imagenes: 'Debes autorizar el acceso a tu galería para adjuntar imágenes.',
      }));
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: IMAGENES_MAX - imagenes.length,
      quality: 0.8,
    });

    if (!resultado.canceled) agregarImagenesSeleccionadas(resultado.assets);
  };

  const tomarFoto = async () => {
    if (publicando || imagenes.length >= IMAGENES_MAX) return;

    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      setErrores((previos) => ({
        ...previos,
        imagenes: 'Debes autorizar el uso de la cámara para fotografiar tu producto.',
      }));
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      cameraType: ImagePicker.CameraType.back,
      quality: 0.8,
    });

    if (!resultado.canceled) agregarImagenesSeleccionadas(resultado.assets);
  };

  const quitarImagen = (id: string) => {
    setImagenes((previas) => previas.filter((imagen) => imagen.id !== id));
  };

  const limpiarFormulario = () => {
    setImagenes([]);
    setTitulo('');
    setPrecio('');
    setCategoriaId(undefined);
    setTipoVentaId(undefined);
    setSedeId(sedes[0]?.id);
    setDescripcion('');
    setErrores({});
    setErrorEnvio(undefined);
  };

  const publicar = async () => {
    const encontrados = validarFormularioPublicacion({
      titulo,
      precio,
      categoriaId,
      tipoVentaId,
      sedeId,
      descripcion,
      imagenes: imagenes.length,
    });

    if (hayErrores(encontrados)) {
      setErrores(encontrados);
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (!accessToken || !categoriaId || !tipoVentaId || !sedeId) {
      setErrorEnvio('Tu sesión o los catálogos no están disponibles. Reintenta.');
      return;
    }

    const imagenesParaApi: ImagenSeleccionadaPublicacion[] = imagenes.map((imagen) => ({
      uri: imagen.uri,
      nombre: imagen.nombre,
      mimeType: imagen.mimeType,
    }));

    setPublicando(true);
    setErrores({});
    setErrorEnvio(undefined);

    try {
      const publicacionCreada = await crearPublicacion(
        {
          titulo,
          descripcion,
          precio: precioEnClp(precio),
          sedeId,
          tipoVentaId,
          categoriaId,
          imagenes: imagenesParaApi,
        },
        accessToken,
      );
      limpiarFormulario();
      setPublicacionCreadaId(publicacionCreada.id);
      setPublicacionExitosa(true);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        cerrarSesion();
        router.replace('/auth/login');
        return;
      }

      setErrorEnvio(mensajeError(error, 'No pudimos publicar el producto. Reintenta.'));
      scroll.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setPublicando(false);
    }
  };

  const categoriaSeleccionada = categorias.find((categoria) => categoria.id === categoriaId)?.nombre;
  const tipoSeleccionado = tiposVenta.find((tipo) => tipo.id === tipoVentaId)?.nombre;
  const sedeSeleccionada = sedes.find((sede) => sede.id === sedeId)?.nombre;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => {
            if (origen === 'mis-publicaciones') {
              router.replace('/mis-publicaciones');
              return;
            }

            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace('/inicio');
          }}
          style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
        </Pressable>
        <View style={styles.barraTexto}>
          <Text style={styles.titulo}>Publicar</Text>
          <Text style={styles.subtitulo}>Ofrece tu producto o servicio a la comunidad Duoc</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.bloque}>
            <SelectorImagenes
              imagenes={imagenes}
              onSeleccionarGaleria={() => void seleccionarDesdeGaleria()}
              onTomarFoto={() => void tomarFoto()}
              onQuitar={quitarImagen}
              error={errores.imagenes}
              deshabilitado={publicando}
            />
          </View>

          <View style={styles.bloque}>
            <CampoFormulario
              etiqueta="Título *"
              valor={titulo}
              onCambio={(valor) => {
                setTitulo(valor);
                limpiarError('titulo');
              }}
              placeholder="Ej: Calculadora científica programable"
              maximo={TITULO_MAX}
              error={errores.titulo}
              deshabilitado={publicando}
            />

            <CampoFormulario
              etiqueta="Precio *"
              valor={precio}
              onCambio={(valor) => {
                setPrecio(formatearPrecioClp(valor));
                limpiarError('precio');
              }}
              placeholder="12.000"
              prefijo="$"
              teclado="number-pad"
              ayuda="Monto en CLP, mayor a $0."
              error={errores.precio}
              deshabilitado={publicando}
            />

            <SelectorCatalogo
              etiqueta="Categoría *"
              valor={categoriaSeleccionada}
              cargando={cargandoCatalogos}
              error={errores.categoriaId}
              onAbrir={() => setSelectorActivo('categoria')}
            />
            <SelectorCatalogo
              etiqueta="Tipo de venta *"
              valor={tipoSeleccionado}
              cargando={cargandoCatalogos}
              error={errores.tipoVentaId}
              onAbrir={() => setSelectorActivo('tipoVenta')}
            />

            <CampoFormulario
              etiqueta="Descripción *"
              valor={descripcion}
              onCambio={(valor) => {
                setDescripcion(valor);
                limpiarError('descripcion');
              }}
              placeholder="Cuenta el estado del producto, qué incluye y cómo coordinar la entrega."
              multilinea
              maximo={DESCRIPCION_MAX}
              error={errores.descripcion}
              deshabilitado={publicando}
            />

            <SelectorCatalogo
              etiqueta="Sede *"
              valor={sedeSeleccionada}
              cargando={cargandoCatalogos}
              error={errores.sedeId}
              ayuda="La publicación queda asociada a esta sede."
              onAbrir={() => setSelectorActivo('sede')}
            />
          </View>

          {errorCatalogos ? (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{errorCatalogos}</Text>
              <Pressable accessibilityRole="button" onPress={() => void cargarCatalogos()} style={styles.botonReintentar}>
                <Text style={styles.botonReintentarTexto}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          {errorEnvio ? (
            <View style={styles.errorBox}>
              <Text accessibilityRole="alert" style={styles.error}>
                {errorEnvio}
              </Text>
            </View>
          ) : null}

          <View style={styles.resumen}>
            {sesion ? (
              <View style={styles.resumenFila}>
                <MaterialCommunityIcons name="account-outline" size={16} color={colors.muted} />
                <Text style={styles.resumenEtiqueta}>Publicas como</Text>
                <Text style={styles.resumenValor} numberOfLines={1}>
                  {sesion.nombreCompleto}
                </Text>
              </View>
            ) : null}
            <View style={styles.resumenFila}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.muted} />
              <Text style={styles.resumenEtiqueta}>Estado inicial</Text>
              <View style={styles.estado}>
                <Text style={styles.estadoTexto}>Publicada</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: publicando, busy: publicando }}
            disabled={publicando}
            onPress={() => void publicar()}
            style={({ pressed }) => [
              styles.cta,
              publicando && styles.ctaDeshabilitada,
              pressed && styles.pressed,
            ]}>
            {publicando ? (
              <View style={styles.filaCarga}>
                <ActivityIndicator color={colors.navy} size="small" />
                <Text style={styles.ctaTexto}>Publicando producto…</Text>
              </View>
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.navy} />
                <Text style={styles.ctaTexto}>Publicar</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.pie}>
            Se creará con estado inicial «Publicada». Puedes editarla o retirarla después.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <SelectorCatalogoModal
        visible={selectorActivo === 'categoria'}
        titulo="Selecciona una categoría"
        opciones={categorias}
        cargando={cargandoCatalogos}
        error={errorCatalogos}
        onCerrar={() => setSelectorActivo(null)}
        onReintentar={() => void cargarCatalogos()}
        onSeleccionar={(id) => {
          setCategoriaId(id);
          limpiarError('categoriaId');
          setSelectorActivo(null);
        }}
      />
      <SelectorCatalogoModal
        visible={selectorActivo === 'tipoVenta'}
        titulo="Selecciona un tipo de venta"
        opciones={tiposVenta}
        cargando={cargandoCatalogos}
        error={errorCatalogos}
        onCerrar={() => setSelectorActivo(null)}
        onReintentar={() => void cargarCatalogos()}
        onSeleccionar={(id) => {
          setTipoVentaId(id);
          limpiarError('tipoVentaId');
          setSelectorActivo(null);
        }}
      />
      <SelectorCatalogoModal
        visible={selectorActivo === 'sede'}
        titulo="Selecciona una sede"
        opciones={sedes}
        cargando={cargandoCatalogos}
        error={errorCatalogos}
        onCerrar={() => setSelectorActivo(null)}
        onReintentar={() => void cargarCatalogos()}
        onSeleccionar={(id) => {
          setSedeId(id);
          limpiarError('sedeId');
          setSelectorActivo(null);
        }}
      />

      <Modal visible={publicacionExitosa} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalExito}>
            <View style={styles.iconoExito}>
              <Text style={styles.checkExito}>✓</Text>
            </View>
            <Text style={styles.modalTitulo}>¡Publicación creada con éxito!</Text>
            <Text style={styles.textoExito}>
              Tu producto fue publicado correctamente en Pasa el Dato.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPublicacionExitosa(false);
                if (publicacionCreadaId) {
                  router.replace({
                    pathname: '/producto/[id]',
                    params: { id: publicacionCreadaId },
                  });
                }
              }}
              style={styles.cta}>
              <Text style={styles.ctaTexto}>Continuar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CampoFormulario({
  etiqueta,
  valor,
  onCambio,
  placeholder,
  multilinea,
  teclado,
  prefijo,
  maximo,
  ayuda,
  error,
  deshabilitado,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  placeholder: string;
  multilinea?: boolean;
  teclado?: 'default' | 'number-pad';
  prefijo?: string;
  maximo?: number;
  ayuda?: string;
  error?: string;
  deshabilitado?: boolean;
}) {
  return (
    <View style={styles.campo}>
      <View style={styles.campoEncabezado}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        {maximo ? <Text style={styles.contador}>{valor.length}/{maximo}</Text> : null}
      </View>
      <View style={[styles.inputCaja, multilinea && styles.inputCajaAlta, error && styles.inputError]}>
        {prefijo ? <Text style={styles.prefijo}>{prefijo}</Text> : null}
        <TextInput
          editable={!deshabilitado}
          value={valor}
          onChangeText={onCambio}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={teclado ?? 'default'}
          maxLength={maximo}
          multiline={multilinea}
          textAlignVertical={multilinea ? 'top' : 'center'}
          style={[styles.input, multilinea && styles.inputAlto]}
        />
      </View>
      {ayuda && !error ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function SelectorCatalogo({
  etiqueta,
  valor,
  cargando,
  error,
  ayuda,
  onAbrir,
}: {
  etiqueta: string;
  valor?: string;
  cargando: boolean;
  error?: string;
  ayuda?: string;
  onAbrir: () => void;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Pressable accessibilityRole="button" onPress={onAbrir} style={[styles.selector, error && styles.inputError]}>
        {cargando ? (
          <ActivityIndicator color={colors.navy} size="small" />
        ) : (
          <>
            <Text style={valor ? styles.selectorValor : styles.selectorPlaceholder}>
              {valor ?? 'Selecciona una opción'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.navy} />
          </>
        )}
      </Pressable>
      {ayuda && !error ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
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
  volver: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  barraTexto: { flex: 1 },
  titulo: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  subtitulo: { color: colors.muted, fontSize: 12, marginTop: 2 },
  contenido: {
    gap: spacing.padMd,
    paddingBottom: spacing.padLg,
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padMd,
  },
  bloque: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padMd,
    padding: spacing.padMd,
  },
  campo: { gap: 6 },
  campoEncabezado: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  etiqueta: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  contador: { color: colors.muted, fontSize: 12 },
  inputCaja: {
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padSm,
  },
  inputCajaAlta: { alignItems: 'flex-start', paddingVertical: 10 },
  inputError: { borderColor: colors.error },
  prefijo: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  input: { color: colors.navy, flex: 1, fontSize: 15, minWidth: 0, paddingVertical: 6 },
  inputAlto: { minHeight: 110, paddingVertical: 0 },
  ayuda: { color: colors.muted, fontSize: 12 },
  error: { color: colors.error, fontSize: 13 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: colors.error,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    gap: 8,
    padding: spacing.padMd,
  },
  selector: {
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  selectorValor: { color: colors.navy, fontSize: 15 },
  selectorPlaceholder: { color: colors.muted, fontSize: 15 },
  resumen: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: 10,
    padding: spacing.padMd,
  },
  resumenFila: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  resumenEtiqueta: { color: colors.muted, fontSize: 13 },
  resumenValor: { color: colors.navy, flexShrink: 1, fontSize: 13, fontWeight: '600' },
  estado: { backgroundColor: colors.navy, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTexto: { color: colors.gold, fontSize: 11, fontWeight: '700' },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin + 4,
    paddingHorizontal: spacing.padMd,
  },
  ctaDeshabilitada: { opacity: 0.7 },
  ctaTexto: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  filaCarga: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  pie: { color: colors.muted, fontSize: 12, marginTop: -4, textAlign: 'center' },
  pressed: { opacity: 0.9 },
  overlay: {
    backgroundColor: 'rgba(0,43,73,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  modalSelector: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    maxHeight: '75%',
    padding: spacing.padLg,
  },
  modalExito: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padMd,
    padding: spacing.padLg,
  },
  modalTitulo: { color: colors.navy, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  listaCatalogo: { maxHeight: 350 },
  opcionCatalogo: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  opcionCatalogoTexto: { color: colors.navy, fontSize: 15 },
  estadoCatalogo: { alignItems: 'center', gap: spacing.padMd, paddingVertical: spacing.padLg },
  botonReintentar: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.padMd,
  },
  botonReintentarTexto: { color: colors.navy, fontWeight: '700' },
  cerrarSelector: { alignSelf: 'flex-end', marginTop: spacing.padMd, padding: 6 },
  cerrarSelectorTexto: { color: colors.navy, fontWeight: '700' },
  iconoExito: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: colors.navy,
    borderRadius: 35,
    borderWidth: 2,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  checkExito: { color: colors.navy, fontSize: 38, fontWeight: '800' },
  textoExito: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
