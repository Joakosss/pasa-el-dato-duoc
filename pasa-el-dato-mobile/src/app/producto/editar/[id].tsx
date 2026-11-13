import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/lib/api';
import {
  actualizarPublicacion,
  obtenerPublicacionParaEdicion,
  type PublicacionEdicion,
} from '@/lib/api/publicaciones';
import {
  formatearPrecioClp,
  precioEnClp,
  validarDescripcion,
  validarPrecio,
  validarTitulo,
} from '@/lib/validators/publicacion';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

function mensajeError(error: unknown, respaldo: string): string {
  if (error instanceof ApiError) return error.message || respaldo;
  if (error instanceof Error && error.message) return error.message;
  return respaldo;
}

export default function EditarPublicacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accessToken = useSesionStore(selectAccessToken);
  const [publicacion, setPublicacion] = useState<PublicacionEdicion | null>(null);
  const [titulo, setTitulo] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [errorTitulo, setErrorTitulo] = useState<string | undefined>();
  const [errorPrecio, setErrorPrecio] = useState<string | undefined>();
  const [errorDescripcion, setErrorDescripcion] = useState<string | undefined>();

  const cargar = useCallback(async () => {
    if (!id || !accessToken) {
      setError('Tu sesión no está disponible. Inicia sesión nuevamente.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(undefined);

    try {
      const respuesta = await obtenerPublicacionParaEdicion(id, accessToken);
      setPublicacion(respuesta);
      setTitulo(respuesta.titulo);
      setPrecio(formatearPrecioClp(String(respuesta.precio)));
      setDescripcion(respuesta.descripcion);
    } catch (causa: unknown) {
      setError(mensajeError(causa, 'No pudimos cargar esta publicación para editar.'));
    } finally {
      setCargando(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async () => {
    if (!publicacion || !accessToken || guardando) return;

    const tituloValidacion = validarTitulo(titulo);
    const precioValidacion = validarPrecio(precio);
    const descripcionValidacion = validarDescripcion(descripcion);

    setErrorTitulo(tituloValidacion.error);
    setErrorPrecio(precioValidacion.error);
    setErrorDescripcion(descripcionValidacion.error);

    if (!tituloValidacion.ok || !precioValidacion.ok || !descripcionValidacion.ok) return;

    setGuardando(true);
    setError(undefined);

    try {
      await actualizarPublicacion(
        publicacion.id,
        {
          titulo,
          descripcion,
          precio: precioEnClp(precio),
          sedeId: publicacion.sede.id,
          tipoVentaId: publicacion.tipoVenta.id,
          categoriaId: publicacion.categoria.id,
        },
        accessToken,
      );
      router.back();
    } catch (causa: unknown) {
      setError(mensajeError(causa, 'No pudimos guardar los cambios. Reintenta.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.barraTitulo}>Editar publicación</Text>
      </View>

      {cargando ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.navy} />
          <Text style={styles.estadoTexto}>Cargando publicación…</Text>
        </View>
      ) : error && !publicacion ? (
        <View style={styles.estado}>
          <Text style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void cargar()} style={styles.boton}>
            <Text style={styles.botonTexto}>Reintentar</Text>
          </Pressable>
        </View>
      ) : publicacion ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            <Text style={styles.ayuda}>
              Puedes modificar el título, precio y descripción. Se conservan categoría, tipo de venta,
              sede e imágenes actuales.
            </Text>

            <Campo
              etiqueta="Título *"
              valor={titulo}
              onCambio={(valor) => {
                setTitulo(valor);
                setErrorTitulo(undefined);
              }}
              error={errorTitulo}
              editable={!guardando}
            />
            <Campo
              etiqueta="Precio *"
              valor={precio}
              onCambio={(valor) => {
                setPrecio(formatearPrecioClp(valor));
                setErrorPrecio(undefined);
              }}
              error={errorPrecio}
              editable={!guardando}
              teclado="number-pad"
              prefijo="$"
            />
            <Campo
              etiqueta="Descripción *"
              valor={descripcion}
              onCambio={(valor) => {
                setDescripcion(valor);
                setErrorDescripcion(undefined);
              }}
              error={errorDescripcion}
              editable={!guardando}
              multilinea
            />

            <View style={styles.resumen}>
              <Text style={styles.resumenTitulo}>Datos que se conservarán</Text>
              <Text style={styles.resumenTexto}>Categoría: {publicacion.categoria.nombre}</Text>
              <Text style={styles.resumenTexto}>Tipo de venta: {publicacion.tipoVenta.nombre}</Text>
              <Text style={styles.resumenTexto}>Sede: {publicacion.sede.nombre}</Text>
              <Text style={styles.resumenTexto}>Imágenes: {publicacion.imagenes.length}</Text>
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: guardando, busy: guardando }}
              disabled={guardando}
              onPress={() => void guardar()}
              style={[styles.boton, guardando && styles.deshabilitado]}>
              {guardando ? <ActivityIndicator color={colors.navy} /> : <Text style={styles.botonTexto}>Guardar cambios</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </SafeAreaView>
  );
}

function Campo({
  etiqueta,
  valor,
  onCambio,
  error,
  editable,
  multilinea = false,
  teclado = 'default',
  prefijo,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  error?: string;
  editable: boolean;
  multilinea?: boolean;
  teclado?: 'default' | 'number-pad';
  prefijo?: string;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={[styles.inputCaja, multilinea && styles.inputAlta, error && styles.inputError]}>
        {prefijo ? <Text style={styles.prefijo}>{prefijo}</Text> : null}
        <TextInput
          editable={editable}
          value={valor}
          onChangeText={onCambio}
          keyboardType={teclado}
          multiline={multilinea}
          textAlignVertical={multilinea ? 'top' : 'center'}
          style={[styles.input, multilinea && styles.inputMultilinea]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  barra: { alignItems: 'center', backgroundColor: colors.card, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.padSm, paddingHorizontal: spacing.padMd, paddingVertical: 10 },
  volver: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  barraTitulo: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  contenido: { gap: spacing.padMd, padding: spacing.padMd },
  estado: { alignItems: 'center', flex: 1, gap: spacing.padMd, justifyContent: 'center', padding: spacing.padLg },
  estadoTexto: { color: colors.muted, fontSize: 14 },
  ayuda: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  campo: { gap: 6 },
  etiqueta: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  inputCaja: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: spacing.radiusMd, borderWidth: 1, flexDirection: 'row', minHeight: spacing.touchMin, paddingHorizontal: spacing.padSm },
  inputAlta: { alignItems: 'flex-start', paddingVertical: 10 },
  inputError: { borderColor: colors.error },
  input: { color: colors.navy, flex: 1, fontSize: 15, paddingVertical: 6 },
  inputMultilinea: { minHeight: 120, paddingVertical: 0 },
  prefijo: { color: colors.muted, fontWeight: '600' },
  resumen: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: spacing.radiusMd, borderWidth: 1, gap: 4, padding: spacing.padMd },
  resumenTitulo: { color: colors.navy, fontWeight: '700', marginBottom: 2 },
  resumenTexto: { color: colors.muted, fontSize: 13 },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  boton: { alignItems: 'center', backgroundColor: colors.gold, borderRadius: spacing.radiusMd, justifyContent: 'center', minHeight: spacing.touchMin, paddingHorizontal: spacing.padMd },
  botonTexto: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  deshabilitado: { opacity: 0.7 },
});
