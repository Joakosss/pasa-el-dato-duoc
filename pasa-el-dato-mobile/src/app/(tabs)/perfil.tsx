import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/lib/api';
import { type SedeCatalogo, listarSedes } from '@/lib/api/catalogos';
import {
  actualizarPerfil,
  obtenerPerfil,
  type ActualizarPerfilRequest,
  type PerfilRespuesta,
} from '@/lib/api/perfil';
import {
  formatearTelefonoChile,
  normalizarTelefonoChile,
  validarTelefonoChile,
} from '@/lib/validators/telefono';
import { selectAccessToken, useSesionStore } from '@/stores/sesion-store';
import { colors, spacing } from '@/theme';

interface FormularioPerfil {
  pNombre: string;
  sNombre: string;
  pApellido: string;
  sApellido: string;
  telefono: string;
  sedeId?: number;
}

function nombreCompleto(perfil: PerfilRespuesta): string {
  return [perfil.pNombre, perfil.sNombre, perfil.pApellido, perfil.sApellido]
    .filter((parte): parte is string => Boolean(parte?.trim()))
    .join(' ');
}

function iniciales(perfil: PerfilRespuesta): string {
  return [perfil.pNombre, perfil.pApellido]
    .filter(Boolean)
    .map((nombre) => nombre.trim().charAt(0).toUpperCase())
    .join('');
}

function telefonoParaFormulario(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');

  if (/^\d{8}$/.test(digitos)) {
    return formatearTelefonoChile(`9${digitos}`);
  }

  return formatearTelefonoChile(telefono);
}

function formularioDesdePerfil(perfil: PerfilRespuesta): FormularioPerfil {
  return {
    pNombre: perfil.pNombre,
    sNombre: perfil.sNombre ?? '',
    pApellido: perfil.pApellido,
    sApellido: perfil.sApellido,
    telefono: telefonoParaFormulario(perfil.telefono),
  };
}

function mensajeError(error: unknown, respaldo: string): string {
  if (error instanceof ApiError) return error.message || respaldo;

  return respaldo;
}

function ItemInformativo({
  icono,
  etiqueta,
  valor,
}: {
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  etiqueta: string;
  valor: string;
}) {
  return (
    <View style={styles.itemInformativo}>
      <MaterialCommunityIcons color={colors.gold} name={icono} size={21} />
      <View style={styles.itemContenido}>
        <Text style={styles.itemEtiqueta}>{etiqueta}</Text>
        <Text style={styles.itemValor}>{valor || '—'}</Text>
      </View>
    </View>
  );
}

export default function PerfilScreen() {
  const accessToken = useSesionStore(selectAccessToken);
  const [perfil, setPerfil] = useState<PerfilRespuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | undefined>();
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [modalSedesAbierto, setModalSedesAbierto] = useState(false);
  const [formulario, setFormulario] = useState<FormularioPerfil>({
    pNombre: '',
    sNombre: '',
    pApellido: '',
    sApellido: '',
    telefono: '',
  });
  const [sedes, setSedes] = useState<SedeCatalogo[]>([]);
  const [cargandoSedes, setCargandoSedes] = useState(false);
  const [errorSedes, setErrorSedes] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | undefined>();
  const [mensajeExito, setMensajeExito] = useState<string | undefined>();

  const cerrarSesion = () => {
    useSesionStore.getState().cerrarSesion();
    router.replace('/auth/login');
  };

  const cargarPerfil = async () => {
    if (!accessToken) {
      setErrorCarga('Tu sesión no está disponible. Inicia sesión nuevamente.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setErrorCarga(undefined);

    try {
      setPerfil(await obtenerPerfil({ accessToken }));
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        cerrarSesion();
        return;
      }

      setErrorCarga(mensajeError(error, 'No pudimos cargar tu perfil.'));
    } finally {
      setCargando(false);
    }
  };

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

  useEffect(() => {
    const solicitud = setTimeout(() => {
      void cargarPerfil();
    }, 0);

    return () => clearTimeout(solicitud);
  }, [accessToken]);

  const abrirEdicion = () => {
    if (!perfil) return;

    setFormulario(formularioDesdePerfil(perfil));
    setErrorEdicion(undefined);
    setMensajeExito(undefined);
    setModalEdicionAbierto(true);
    void cargarSedes();
  };

  const guardarCambios = async () => {
    if (!accessToken || !perfil || guardando) return;

    const validacionTelefono = validarTelefonoChile(formulario.telefono);
    if (!validacionTelefono.ok || !validacionTelefono.normalizado) {
      setErrorEdicion(validacionTelefono.error);
      return;
    }

    const telefonoNormalizado = normalizarTelefonoChile(formulario.telefono);
    if (!telefonoNormalizado) {
      setErrorEdicion('Ingresa un teléfono chileno válido.');
      return;
    }

    const datosActualizados: ActualizarPerfilRequest = {
      pNombre: formulario.pNombre.trim(),
      sNombre: formulario.sNombre.trim() || null,
      pApellido: formulario.pApellido.trim(),
      sApellido: formulario.sApellido.trim(),
      telefono: telefonoNormalizado,
      ...(formulario.sedeId ? { sedeId: formulario.sedeId } : {}),
    };

    setGuardando(true);
    setErrorEdicion(undefined);

    try {
      const perfilActualizado = await actualizarPerfil(datosActualizados, { accessToken });
      setPerfil(perfilActualizado);
      setModalEdicionAbierto(false);
      setMensajeExito('Perfil actualizado correctamente.');
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        cerrarSesion();
        return;
      }

      setErrorEdicion(mensajeError(error, 'No pudimos guardar los cambios.'));
    } finally {
      setGuardando(false);
    }
  };

  const sedeSeleccionada =
    sedes.find((sede) => sede.id === formulario.sedeId)?.nombre ?? perfil?.sede.nombre;

  if (cargando) {
    return (
      <SafeAreaView style={styles.estadoPantalla}>
        <ActivityIndicator color={colors.navy} size="large" />
        <Text style={styles.estadoTexto}>Cargando perfil…</Text>
      </SafeAreaView>
    );
  }

  if (errorCarga || !perfil) {
    return (
      <SafeAreaView style={styles.estadoPantalla}>
        <MaterialCommunityIcons color={colors.error} name="alert-circle-outline" size={36} />
        <Text style={styles.errorTexto}>{errorCarga ?? 'No hay información de perfil disponible.'}</Text>
        <Pressable accessibilityRole="button" onPress={() => void cargarPerfil()} style={styles.botonPrimario}>
          <Text style={styles.botonPrimarioTexto}>Reintentar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={cerrarSesion} style={styles.botonSecundario}>
          <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <View style={styles.encabezado}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciales(perfil) || 'PD'}</Text>
          </View>
          <Text style={styles.nombre}>{nombreCompleto(perfil)}</Text>
          <View style={styles.badgeRol}>
            <Text style={styles.badgeRolTexto}>{perfil.rol.descripcion}</Text>
          </View>
        </View>

        {mensajeExito ? (
          <View style={styles.exitoBox}>
            <MaterialCommunityIcons color={colors.navy} name="check-circle" size={20} />
            <Text style={styles.exitoTexto}>{mensajeExito}</Text>
          </View>
        ) : null}

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Datos personales</Text>
          <ItemInformativo icono="card-account-details-outline" etiqueta="RUN" valor={perfil.run} />
          <ItemInformativo icono="email-outline" etiqueta="Correo institucional" valor={perfil.correo} />
          <ItemInformativo
            icono="phone-outline"
            etiqueta="Teléfono"
            valor={telefonoParaFormulario(perfil.telefono)}
          />
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Datos académicos</Text>
          <ItemInformativo icono="map-marker-outline" etiqueta="Sede" valor={perfil.sede.nombre} />
          <ItemInformativo icono="school-outline" etiqueta="Carrera" valor={perfil.carrera.nombre} />
        </View>

        <Pressable accessibilityRole="button" onPress={abrirEdicion} style={styles.botonPrimario}>
          <MaterialCommunityIcons color={colors.navy} name="pencil-outline" size={19} />
          <Text style={styles.botonPrimarioTexto}>Editar perfil</Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={cerrarSesion} style={styles.botonSecundario}>
          <MaterialCommunityIcons color={colors.error} name="logout" size={19} />
          <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={modalEdicionAbierto}
        animationType="slide"
        transparent
        onRequestClose={() => !guardando && setModalEdicionAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitulo}>Editar perfil</Text>

              <Text style={styles.etiquetaCampo}>Primer nombre</Text>
              <TextInput
                editable={!guardando}
                value={formulario.pNombre}
                onChangeText={(pNombre) => setFormulario((actual) => ({ ...actual, pNombre }))}
                style={styles.input}
              />

              <Text style={styles.etiquetaCampo}>Segundo nombre</Text>
              <TextInput
                editable={!guardando}
                value={formulario.sNombre}
                onChangeText={(sNombre) => setFormulario((actual) => ({ ...actual, sNombre }))}
                style={styles.input}
              />

              <Text style={styles.etiquetaCampo}>Apellido paterno</Text>
              <TextInput
                editable={!guardando}
                value={formulario.pApellido}
                onChangeText={(pApellido) => setFormulario((actual) => ({ ...actual, pApellido }))}
                style={styles.input}
              />

              <Text style={styles.etiquetaCampo}>Apellido materno</Text>
              <TextInput
                editable={!guardando}
                value={formulario.sApellido}
                onChangeText={(pApellido) => setFormulario((actual) => ({ ...actual, sApellido: pApellido }))}
                style={styles.input}
              />

              <Text style={styles.etiquetaCampo}>Teléfono</Text>
              <TextInput
                editable={!guardando}
                keyboardType="phone-pad"
                value={formulario.telefono}
                onChangeText={(telefono) =>
                  setFormulario((actual) => ({
                    ...actual,
                    telefono: formatearTelefonoChile(telefono),
                  }))
                }
                placeholder="+56 9 3651 7901"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />

              <Text style={styles.etiquetaCampo}>Sede</Text>
              <Pressable
                accessibilityRole="button"
                disabled={guardando}
                onPress={() => setModalSedesAbierto(true)}
                style={styles.selector}>
                <Text style={styles.selectorTexto}>{sedeSeleccionada ?? 'Selecciona una sede'}</Text>
                <MaterialCommunityIcons color={colors.navy} name="chevron-down" size={22} />
              </Pressable>

              {errorEdicion ? <Text accessibilityRole="alert" style={styles.errorTexto}>{errorEdicion}</Text> : null}

              <View style={styles.accionesModal}>
                <Pressable
                  accessibilityRole="button"
                  disabled={guardando}
                  onPress={() => setModalEdicionAbierto(false)}
                  style={styles.botonCancelar}>
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: guardando, disabled: guardando }}
                  disabled={guardando}
                  onPress={() => void guardarCambios()}
                  style={[styles.botonPrimario, styles.botonGuardar, guardando && styles.botonDeshabilitado]}>
                  {guardando ? (
                    <ActivityIndicator color={colors.navy} size="small" />
                  ) : (
                    <Text numberOfLines={1} style={styles.botonPrimarioTexto}>
                      Guardar
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalSedesAbierto}
        animationType="fade"
        transparent
        onRequestClose={() => setModalSedesAbierto(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalSedes}>
            <Text style={styles.modalTitulo}>Selecciona tu sede</Text>
            {cargandoSedes ? (
              <View style={styles.estadoSelector}>
                <ActivityIndicator color={colors.navy} />
                <Text style={styles.estadoTexto}>Cargando sedes…</Text>
              </View>
            ) : errorSedes ? (
              <View style={styles.estadoSelector}>
                <Text style={styles.errorTexto}>{errorSedes}</Text>
                <Pressable accessibilityRole="button" onPress={() => void cargarSedes()} style={styles.botonPrimario}>
                  <Text style={styles.botonPrimarioTexto}>Reintentar</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView style={styles.listaSedes} showsVerticalScrollIndicator={false}>
                {sedes.map((sede) => (
                  <Pressable
                    key={sede.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setFormulario((actual) => ({ ...actual, sedeId: sede.id }));
                      setModalSedesAbierto(false);
                    }}
                    style={styles.opcionSede}>
                    <Text style={styles.opcionSedeTexto}>{sede.nombre}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Pressable accessibilityRole="button" onPress={() => setModalSedesAbierto(false)} style={styles.cerrarSelector}>
              <Text style={styles.botonCancelarTexto}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  contenido: { gap: spacing.padMd, padding: spacing.padLg },
  estadoPantalla: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    gap: spacing.padMd,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  estadoTexto: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  encabezado: { alignItems: 'center', gap: 8 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderColor: colors.gold,
    borderRadius: 44,
    borderWidth: 3,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarTexto: { color: colors.gold, fontSize: 29, fontWeight: '800' },
  nombre: { color: colors.navy, fontSize: 23, fontWeight: '700', textAlign: 'center' },
  badgeRol: {
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.padMd,
    paddingVertical: 6,
  },
  badgeRolTexto: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  tarjeta: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: 4,
    padding: spacing.padMd,
  },
  tituloSeccion: { color: colors.navy, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  itemInformativo: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 9,
  },
  itemContenido: { flex: 1, gap: 2 },
  itemEtiqueta: { color: colors.muted, fontSize: 13 },
  itemValor: { color: colors.navy, fontSize: 15, fontWeight: '600' },
  exitoBox: {
    alignItems: 'center',
    backgroundColor: '#fff8dc',
    borderColor: colors.gold,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.padMd,
  },
  exitoTexto: { color: colors.navy, flex: 1, fontSize: 14, fontWeight: '600' },
  botonPrimario: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  botonPrimarioTexto: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  botonSecundario: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  botonCerrarTexto: { color: colors.error, fontSize: 16, fontWeight: '700' },
  overlay: {
    backgroundColor: 'rgba(0,43,73,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  modal: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    maxHeight: '90%',
    padding: spacing.padLg,
  },
  modalSedes: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    maxHeight: '75%',
    padding: spacing.padLg,
  },
  modalTitulo: { color: colors.navy, fontSize: 20, fontWeight: '700', marginBottom: spacing.padMd },
  etiquetaCampo: { color: colors.navy, fontSize: 14, fontWeight: '600', marginBottom: 5, marginTop: 8 },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    color: colors.navy,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
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
  selectorTexto: { color: colors.navy, fontSize: 15 },
  accionesModal: { flexDirection: 'row', gap: 8, marginTop: spacing.padLg },
  botonCancelar: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  botonCancelarTexto: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  botonGuardar: { flex: 1, height: 48, paddingHorizontal: 4 },
  botonDeshabilitado: { opacity: 0.7 },
  errorTexto: { color: colors.error, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  estadoSelector: { alignItems: 'center', gap: spacing.padMd, paddingVertical: spacing.padLg },
  listaSedes: { maxHeight: 340 },
  opcionSede: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  opcionSedeTexto: { color: colors.navy, fontSize: 15 },
  cerrarSelector: { alignSelf: 'flex-end', marginTop: spacing.padMd, padding: 6 },
});
