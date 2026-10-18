import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRef, useState } from 'react';
import {
  Alert,
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

import { colors, spacing } from '@/theme';
import { SelectorImagenes } from '@/components/publicar/SelectorImagenes';
import {
  CATEGORIAS_FEED,
  SEDES_PUBLICACION,
  TIPOS_VENTA,
  type NombreIcono,
  type TipoPublicacion,
} from '@/lib/feed/publicaciones-placeholder';
import {
  DESCRIPCION_MAX,
  IMAGENES_MAX,
  TITULO_MAX,
  hayErrores,
  validarFormularioPublicacion,
  type CampoPublicacion,
  type ErroresPublicacion,
} from '@/lib/validators/publicacion';
import { selectSesion, useSesionStore } from '@/stores/sesion-store';

// Publicar: formulario de creación según CU005 y HU-PUB-01. Incluye todos los
// datos de una publicación: imágenes (1 a 5), título, precio, categoría, tipo de
// venta, descripción, sede y el estado inicial que asigna el sistema.
// Sin red: el contrato de publicaciones no existe todavía, así que la
// confirmación es una simulación (no se persiste nada).

interface OpcionChip {
  valor: string;
  icono?: NombreIcono;
}

const OPCIONES_CATEGORIA: OpcionChip[] = CATEGORIAS_FEED.map((categoria) => ({
  valor: categoria.etiqueta,
  icono: categoria.icono,
}));

const OPCIONES_TIPO: OpcionChip[] = TIPOS_VENTA.map((tipo) => ({ valor: tipo }));

const OPCIONES_SEDE: OpcionChip[] = SEDES_PUBLICACION.map((sede) => ({
  valor: sede,
}));

export default function PublicarScreen() {
  const sesion = useSesionStore(selectSesion);
  const scroll = useRef<ScrollView>(null);

  const [imagenes, setImagenes] = useState<string[]>([]);
  const [titulo, setTitulo] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoPublicacion | null>(null);
  const [descripcion, setDescripcion] = useState('');
  // La sede se confirma por defecto: CU005 permite seleccionar o confirmar.
  const [sede, setSede] = useState<string | null>(SEDES_PUBLICACION[0] ?? null);
  const [errores, setErrores] = useState<ErroresPublicacion>({});

  const limpiarError = (campo: CampoPublicacion) => {
    setErrores((previos) =>
      previos[campo] ? { ...previos, [campo]: undefined } : previos,
    );
  };

  const agregarImagen = () => {
    setImagenes((previas) =>
      previas.length >= IMAGENES_MAX
        ? previas
        : [...previas, `foto-${previas.length + 1}`],
    );
    limpiarError('imagenes');
  };

  const quitarImagen = (id: string) => {
    setImagenes((previas) => previas.filter((imagen) => imagen !== id));
  };

  const limpiarFormulario = () => {
    setImagenes([]);
    setTitulo('');
    setPrecio('');
    setCategoria(null);
    setTipo(null);
    setDescripcion('');
    setSede(SEDES_PUBLICACION[0] ?? null);
    setErrores({});
  };

  const publicar = () => {
    const encontrados = validarFormularioPublicacion({
      titulo,
      precio,
      categoria,
      tipo,
      sede,
      descripcion,
      imagenes: imagenes.length,
    });

    if (hayErrores(encontrados)) {
      setErrores(encontrados);
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setErrores({});

    // TODO: reemplazar por el POST real cuando exista el contrato de
    // publicaciones (estado inicial `Publicada`).
    Alert.alert(
      '¡Publicación creada!',
      `«${titulo.trim()}» quedó con estado inicial Publicada. Todavía no se guarda en el servidor: falta el contrato de publicaciones.`,
    );
    limpiarFormulario();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Text style={styles.titulo}>Publicar</Text>
        <Text style={styles.subtitulo}>
          Ofrece tu producto o servicio a la comunidad Duoc
        </Text>
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
              onAgregar={agregarImagen}
              onQuitar={quitarImagen}
              error={errores.imagenes}
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
            />

            <CampoFormulario
              etiqueta="Precio *"
              valor={precio}
              onCambio={(valor) => {
                setPrecio(valor);
                limpiarError('precio');
              }}
              placeholder="12.000"
              prefijo="$"
              teclado="number-pad"
              ayuda="Monto en CLP, mayor a $0."
              error={errores.precio}
            />

            <GrupoChips
              etiqueta="Categoría *"
              opciones={OPCIONES_CATEGORIA}
              valor={categoria}
              onSeleccionar={(valor) => {
                setCategoria(valor);
                limpiarError('categoria');
              }}
              desplazable
              error={errores.categoria}
            />

            <GrupoChips
              etiqueta="Tipo de venta *"
              opciones={OPCIONES_TIPO}
              valor={tipo}
              onSeleccionar={(valor) => {
                setTipo(valor as TipoPublicacion);
                limpiarError('tipo');
              }}
              error={errores.tipo}
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
            />

            <GrupoChips
              etiqueta="Sede *"
              opciones={OPCIONES_SEDE}
              valor={sede}
              onSeleccionar={(valor) => {
                setSede(valor);
                limpiarError('sede');
              }}
              ayuda="La publicación queda asociada a esta sede."
              error={errores.sede}
            />
          </View>

          <View style={styles.resumen}>
            {sesion ? (
              <View style={styles.resumenFila}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color={colors.muted}
                />
                <Text style={styles.resumenEtiqueta}>Publicas como</Text>
                <Text style={styles.resumenValor} numberOfLines={1}>
                  {sesion.nombreCompleto}
                </Text>
              </View>
            ) : null}

            <View style={styles.resumenFila}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={colors.muted}
              />
              <Text style={styles.resumenEtiqueta}>Estado inicial</Text>
              <View style={styles.estado}>
                <Text style={styles.estadoTexto}>Publicada</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publicar"
            onPress={publicar}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color={colors.navy}
            />
            <Text style={styles.ctaTexto}>Publicar</Text>
          </Pressable>

          <Text style={styles.pie}>
            Se creará con estado inicial «Publicada». Puedes editarla o retirarla
            después.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Campo de una línea o multilínea con etiqueta, contador y error por campo.
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
}) {
  return (
    <View style={styles.campo}>
      <View style={styles.campoEncabezado}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        {maximo ? (
          <Text style={styles.contador}>
            {valor.length}/{maximo}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.inputCaja,
          multilinea && styles.inputCajaAlta,
          error ? styles.inputError : null,
        ]}>
        {prefijo ? <Text style={styles.prefijo}>{prefijo}</Text> : null}

        <TextInput
          value={valor}
          onChangeText={onCambio}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={teclado ?? 'default'}
          maxLength={maximo}
          multiline={multilinea}
          textAlignVertical={multilinea ? 'top' : 'center'}
          accessibilityLabel={etiqueta.replace(' *', '')}
          style={[styles.input, multilinea && styles.inputAlto]}
        />
      </View>

      {ayuda && !error ? <Text style={styles.ayuda}>{ayuda}</Text> : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// Filtros rápidos de opción única: categoría (deslizable, como en el inicio),
// tipo de venta y sede.
function GrupoChips({
  etiqueta,
  opciones,
  valor,
  onSeleccionar,
  desplazable,
  ayuda,
  error,
}: {
  etiqueta: string;
  opciones: OpcionChip[];
  valor: string | null;
  onSeleccionar: (valor: string) => void;
  desplazable?: boolean;
  ayuda?: string;
  error?: string;
}) {
  const chips = opciones.map((opcion) => (
    <Pressable
      key={opcion.valor}
      accessibilityRole="button"
      accessibilityLabel={`${etiqueta.replace(' *', '')}: ${opcion.valor}`}
      accessibilityState={{ selected: valor === opcion.valor }}
      onPress={() => onSeleccionar(opcion.valor)}
      style={({ pressed }) => [
        styles.chip,
        valor === opcion.valor && styles.chipActivo,
        pressed && styles.pressed,
      ]}>
      {opcion.icono ? (
        <MaterialCommunityIcons
          name={opcion.icono}
          size={15}
          color={valor === opcion.valor ? colors.gold : colors.navy}
        />
      ) : null}
      <Text
        style={[styles.chipTexto, valor === opcion.valor && styles.chipTextoActivo]}>
        {opcion.valor}
      </Text>
    </Pressable>
  ));

  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>

      {desplazable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}>
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.chipsEnvueltos}>{chips}</View>
      )}

      {ayuda && !error ? <Text style={styles.ayuda}>{ayuda}</Text> : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  barra: {
    paddingHorizontal: spacing.padMd,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  titulo: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitulo: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  contenido: {
    paddingHorizontal: spacing.padMd,
    paddingTop: spacing.padMd,
    paddingBottom: spacing.padLg,
    gap: spacing.padMd,
  },
  bloque: {
    padding: spacing.padMd,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    gap: spacing.padMd,
  },
  campo: {
    gap: 6,
  },
  campoEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etiqueta: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  contador: {
    color: colors.muted,
    fontSize: 12,
  },
  inputCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padSm,
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
  },
  inputCajaAlta: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputError: {
    borderColor: colors.error,
  },
  prefijo: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.navy,
    fontSize: 15,
    paddingVertical: 6,
  },
  inputAlto: {
    minHeight: 110,
    paddingVertical: 0,
  },
  ayuda: {
    color: colors.muted,
    fontSize: 12,
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chips: {
    gap: 8,
  },
  chipsEnvueltos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  chipActivo: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipTexto: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextoActivo: {
    color: colors.gold,
  },
  resumen: {
    padding: spacing.padMd,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    gap: 10,
  },
  resumenFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resumenEtiqueta: {
    color: colors.muted,
    fontSize: 13,
  },
  resumenValor: {
    flexShrink: 1,
    color: colors.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  estado: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.navy,
  },
  estadoTexto: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: spacing.touchMin + 4,
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
  },
  ctaTexto: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  pie: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
  },
  pressed: {
    opacity: 0.9,
  },
});
