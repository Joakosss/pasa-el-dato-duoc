import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  type CarreraCatalogo,
  type CatalogoBasico,
  type SedeCatalogo,
  listarCarreras,
  listarEscuelas,
  listarSedes,
} from '@/lib/api/catalogos';
import { colors, spacing } from '@/theme';

type SelectorActivo = 'sede' | 'escuela' | 'carrera' | null;

interface Props {
  sedeId?: number;
  escuelaId?: number;
  carreraId?: number;
  onSedeChange: (sedeId: number) => void;
  onEscuelaChange: (escuelaId: number) => void;
  onCarreraChange: (carreraId: number) => void;
}

interface OpcionSelector {
  id: number;
  nombre: string;
}

interface SelectorModalProps {
  titulo: string;
  visible: boolean;
  cargando: boolean;
  error?: string;
  opciones: OpcionSelector[];
  onCerrar: () => void;
  onReintentar: () => void;
  onSeleccionar: (id: number) => void;
}

function SelectorModal({
  titulo,
  visible,
  cargando,
  error,
  opciones,
  onCerrar,
  onReintentar,
  onSeleccionar,
}: SelectorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitulo}>{titulo}</Text>
          {cargando ? (
            <View style={styles.estado}>
              <ActivityIndicator color={colors.navy} />
              <Text style={styles.estadoTexto}>Cargando opciones…</Text>
            </View>
          ) : error ? (
            <View style={styles.estado}>
              <Text style={styles.error}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={onReintentar} style={styles.reintentar}>
                <Text style={styles.reintentarTexto}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
              {opciones.map((opcion) => (
                <Pressable
                  key={opcion.id}
                  accessibilityRole="button"
                  onPress={() => onSeleccionar(opcion.id)}
                  style={styles.opcion}>
                  <Text style={styles.opcionTexto}>{opcion.nombre}</Text>
                </Pressable>
              ))}
              {!opciones.length ? (
                <Text style={styles.estadoTexto}>No hay opciones disponibles.</Text>
              ) : null}
            </ScrollView>
          )}
          <Pressable accessibilityRole="button" onPress={onCerrar} style={styles.cerrar}>
            <Text style={styles.cerrarTexto}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function nombreSeleccionado<T extends OpcionSelector>(opciones: T[], id?: number): string | undefined {
  return opciones.find((opcion) => opcion.id === id)?.nombre;
}

export function StepCarreraGrafico({
  sedeId,
  escuelaId,
  carreraId,
  onSedeChange,
  onEscuelaChange,
  onCarreraChange,
}: Props) {
  const [selectorActivo, setSelectorActivo] = useState<SelectorActivo>(null);
  const [sedes, setSedes] = useState<SedeCatalogo[]>([]);
  const [escuelas, setEscuelas] = useState<CatalogoBasico[]>([]);
  const [carreras, setCarreras] = useState<CarreraCatalogo[]>([]);
  const [cargandoSedes, setCargandoSedes] = useState(false);
  const [cargandoEscuelas, setCargandoEscuelas] = useState(false);
  const [cargandoCarreras, setCargandoCarreras] = useState(false);
  const [errorSedes, setErrorSedes] = useState<string | undefined>();
  const [errorEscuelas, setErrorEscuelas] = useState<string | undefined>();
  const [errorCarreras, setErrorCarreras] = useState<string | undefined>();

  const cargarSedes = async () => {
    setCargandoSedes(true);
    setErrorSedes(undefined);
    try {
      setSedes(await listarSedes());
    } catch {
      setErrorSedes('No pudimos cargar las sedes.');
    } finally {
      setCargandoSedes(false);
    }
  };

  const cargarEscuelas = async () => {
    setCargandoEscuelas(true);
    setErrorEscuelas(undefined);
    try {
      setEscuelas(await listarEscuelas());
    } catch {
      setErrorEscuelas('No pudimos cargar las escuelas.');
    } finally {
      setCargandoEscuelas(false);
    }
  };

  const cargarCarreras = async (idEscuela: number) => {
    setCargandoCarreras(true);
    setErrorCarreras(undefined);
    try {
      setCarreras(await listarCarreras(idEscuela));
    } catch {
      setErrorCarreras('No pudimos cargar las carreras.');
    } finally {
      setCargandoCarreras(false);
    }
  };

  useEffect(() => {
    const cargaInicial = setTimeout(() => {
      void Promise.all([cargarSedes(), cargarEscuelas()]);
    }, 0);

    return () => clearTimeout(cargaInicial);
  }, []);

  useEffect(() => {
    if (!escuelaId) return;

    const cargaCarreras = setTimeout(() => {
      void cargarCarreras(escuelaId);
    }, 0);

    return () => clearTimeout(cargaCarreras);
  }, [escuelaId]);

  const seleccionarEscuela = (id: number) => {
    onEscuelaChange(id);
    onCarreraChange(0);
    setSelectorActivo(null);
  };

  const seleccionarCarrera = (id: number) => {
    onCarreraChange(id);
    setSelectorActivo(null);
  };

  const abrirCarreras = () => {
    if (escuelaId) {
      setSelectorActivo('carrera');
    }
  };

  return (
    <View style={styles.col}>
      <Text style={styles.label}>Sede *</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSelectorActivo('sede')}
        style={styles.selector}>
        {cargandoSedes ? (
          <ActivityIndicator color={colors.navy} size="small" />
        ) : (
          <Text style={sedeId ? styles.selectorValor : styles.selectorPlaceholder}>
            {nombreSeleccionado(sedes, sedeId) ?? 'Selecciona tu sede'}
          </Text>
        )}
      </Pressable>

      <Text style={styles.label}>Escuela *</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSelectorActivo('escuela')}
        style={styles.selector}>
        {cargandoEscuelas ? (
          <ActivityIndicator color={colors.navy} size="small" />
        ) : (
          <Text style={escuelaId ? styles.selectorValor : styles.selectorPlaceholder}>
            {nombreSeleccionado(escuelas, escuelaId) ?? 'Selecciona tu escuela'}
          </Text>
        )}
      </Pressable>

      <Text style={styles.label}>Carrera *</Text>
      <Pressable
        accessibilityRole="button"
        disabled={!escuelaId || cargandoCarreras}
        onPress={abrirCarreras}
        style={[styles.selector, (!escuelaId || cargandoCarreras) && styles.selectorDeshabilitado]}>
        {cargandoCarreras ? (
          <ActivityIndicator color={colors.navy} size="small" />
        ) : (
          <Text style={carreraId ? styles.selectorValor : styles.selectorPlaceholder}>
            {nombreSeleccionado(carreras, carreraId) ??
              (escuelaId ? 'Selecciona tu carrera' : 'Primero elige escuela')}
          </Text>
        )}
      </Pressable>

      <SelectorModal
        titulo="Selecciona tu sede"
        visible={selectorActivo === 'sede'}
        cargando={cargandoSedes}
        error={errorSedes}
        opciones={sedes}
        onCerrar={() => setSelectorActivo(null)}
        onReintentar={() => void cargarSedes()}
        onSeleccionar={(id) => {
          onSedeChange(id);
          setSelectorActivo(null);
        }}
      />
      <SelectorModal
        titulo="Selecciona tu escuela"
        visible={selectorActivo === 'escuela'}
        cargando={cargandoEscuelas}
        error={errorEscuelas}
        opciones={escuelas}
        onCerrar={() => setSelectorActivo(null)}
        onReintentar={() => void cargarEscuelas()}
        onSeleccionar={seleccionarEscuela}
      />
      <SelectorModal
        titulo="Selecciona tu carrera"
        visible={selectorActivo === 'carrera'}
        cargando={cargandoCarreras}
        error={errorCarreras}
        opciones={carreras}
        onCerrar={() => setSelectorActivo(null)}
        onReintentar={() => escuelaId && void cargarCarreras(escuelaId)}
        onSeleccionar={seleccionarCarrera}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: 10 },
  label: { fontSize: 14, fontWeight: '600', color: colors.navy },
  selector: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    justifyContent: 'center',
  },
  selectorDeshabilitado: { opacity: 0.65 },
  selectorPlaceholder: { color: colors.muted, fontSize: 14 },
  selectorValor: { color: colors.navy, fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,43,73,0.6)',
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  modal: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
    padding: spacing.padLg,
    gap: 12,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: colors.navy },
  lista: { maxHeight: 360 },
  opcion: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    minHeight: spacing.touchMin,
    justifyContent: 'center',
  },
  opcionTexto: { color: colors.navy, fontSize: 15 },
  estado: { alignItems: 'center', gap: 12, paddingVertical: spacing.padLg },
  estadoTexto: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  error: { color: colors.error, fontSize: 14, textAlign: 'center' },
  reintentar: { backgroundColor: colors.gold, borderRadius: spacing.radiusMd, padding: spacing.padMd },
  reintentarTexto: { color: colors.navy, fontWeight: '700' },
  cerrar: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 },
  cerrarTexto: { color: colors.navy, fontWeight: '700' },
});
