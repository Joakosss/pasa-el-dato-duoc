import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoPD } from '@/components/auth/LogoPD';
import { RegistroExitosoModal } from '@/components/auth/RegistroExitosoModal';
import { StepCarreraGrafico } from '@/components/auth/StepCarreraGrafico';
import { StepClaveGrafico } from '@/components/auth/StepClaveGrafico';
import { StepCuentaGrafico } from '@/components/auth/StepCuentaGrafico';
import { StepDatosGrafico, type DatosGrafico } from '@/components/auth/StepDatosGrafico';
import { Stepper } from '@/components/auth/Stepper';
import { TermsModal } from '@/components/auth/TermsModal';
import { ApiError } from '@/lib/api';
import {
  registrarUsuario,
  validarCorreoDisponible,
  validarRunDisponible,
} from '@/lib/api/registro';
import { validarCorreoDuoc } from '@/lib/validators/correo';
import { formatearRun, formatearRunEnEscritura, validarRun } from '@/lib/validators/run';
import {
  formatearTelefonoChile,
  normalizarTelefonoChile,
  validarTelefonoChile,
} from '@/lib/validators/telefono';
import { colors, spacing } from '@/theme';

function obtenerMensajeError(error: unknown, mensajeAlternativo: string): string {
  if (error instanceof ApiError) {
    return error.message || mensajeAlternativo;
  }

  return mensajeAlternativo;
}

export default function RegisterScreen() {
  const [paso, setPaso] = useState(0);
  const [maxVisitado, setMaxVisitado] = useState(0);
  const [run, setRun] = useState('');
  const [correo, setCorreo] = useState('');
  const [errorRun, setErrorRun] = useState<string | undefined>();
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const [errorTelefono, setErrorTelefono] = useState<string | undefined>();
  const [errorClave, setErrorClave] = useState<string | undefined>();
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | undefined>();
  const [errorTerminos, setErrorTerminos] = useState<string | undefined>();
  const [errorRegistro, setErrorRegistro] = useState<string | undefined>();
  const [validandoCuenta, setValidandoCuenta] = useState(false);
  const [creandoCuenta, setCreandoCuenta] = useState(false);
  const [sedeId, setSedeId] = useState<number | undefined>();
  const [escuelaId, setEscuelaId] = useState<number | undefined>();
  const [carreraId, setCarreraId] = useState<number | undefined>();
  const [datos, setDatos] = useState<DatosGrafico>({
    pNombre: '',
    sNombre: '',
    pApellido: '',
    sApellido: '',
    telefono: '',
  });
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const avanzarPaso = () => {
    const siguiente = Math.min(paso + 1, 3);
    setPaso(siguiente);
    setMaxVisitado((prev) => Math.max(prev, siguiente));
  };

  const validarCuentaYAvanzar = async () => {
    if (validandoCuenta) return;

    const validacionCorreo = validarCorreoDuoc(correo);
    const validacionRun = validarRun(run);

    setErrorCorreo(validacionCorreo.error);
    setErrorRun(validacionRun.error);

    if (!validacionCorreo.ok || !validacionRun.ok) return;

    const correoNormalizado = validacionCorreo.normalizado;
    const runNormalizado = validacionRun.normalizado;
    if (!correoNormalizado || !runNormalizado) return;

    setCorreo(correoNormalizado);
    setRun(runNormalizado);
    setValidandoCuenta(true);

    try {
      const [resultadoCorreo, resultadoRun] = await Promise.allSettled([
        validarCorreoDisponible({ correo: correoNormalizado }),
        validarRunDisponible({ run: runNormalizado }),
      ]);

      const siguienteErrorCorreo =
        resultadoCorreo.status === 'rejected'
          ? obtenerMensajeError(resultadoCorreo.reason, 'No fue posible validar el correo.')
          : resultadoCorreo.value
            ? undefined
            : 'El correo ya está registrado.';

      const siguienteErrorRun =
        resultadoRun.status === 'rejected'
          ? obtenerMensajeError(resultadoRun.reason, 'No fue posible validar el RUT.')
          : resultadoRun.value
            ? undefined
            : 'El RUT ya está registrado.';

      setErrorCorreo(siguienteErrorCorreo);
      setErrorRun(siguienteErrorRun);

      if (!siguienteErrorCorreo && !siguienteErrorRun) {
        avanzarPaso();
      }
    } finally {
      setValidandoCuenta(false);
    }
  };

  const validarDatosYAvanzar = () => {
    const validacionTelefono = validarTelefonoChile(datos.telefono);
    setErrorTelefono(validacionTelefono.error);

    const telefonoNormalizado = validacionTelefono.normalizado;
    if (!validacionTelefono.ok || !telefonoNormalizado) return;

    setDatos((prev) => ({
      ...prev,
      telefono: formatearTelefonoChile(telefonoNormalizado),
    }));
    avanzarPaso();
  };

  const validarCarreraYAvanzar = () => {
    if (!sedeId || !escuelaId || !carreraId) {
      Alert.alert('Datos incompletos', 'Selecciona sede, escuela y carrera para continuar.');
      return;
    }

    avanzarPaso();
  };

  const registrar = async () => {
    if (creandoCuenta) return;

    const siguienteErrorClave =
      clave.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : undefined;
    const siguienteErrorConfirmacion =
      clave !== confirmacion ? 'Las contraseñas no coinciden' : undefined;
    const siguienteErrorTerminos = aceptaTerminos
      ? undefined
      : 'Debes aceptar los términos y condiciones.';

    setErrorClave(siguienteErrorClave);
    setErrorConfirmacion(siguienteErrorConfirmacion);
    setErrorTerminos(siguienteErrorTerminos);
    setErrorRegistro(undefined);

    if (siguienteErrorClave || siguienteErrorConfirmacion || siguienteErrorTerminos) return;

    const telefonoNormalizado = normalizarTelefonoChile(datos.telefono);
    if (!telefonoNormalizado || !sedeId || !carreraId) {
      setErrorRegistro('No fue posible preparar los datos de registro. Revisa los pasos anteriores.');
      return;
    }

    setCreandoCuenta(true);

    try {
      await registrarUsuario({
        run: formatearRun(run),
        correo: correo.trim().toLowerCase(),
        pNombre: datos.pNombre.trim(),
        ...(datos.sNombre.trim() ? { sNombre: datos.sNombre.trim() } : {}),
        pApellido: datos.pApellido.trim(),
        sApellido: datos.sApellido.trim(),
        telefono: telefonoNormalizado,
        sedeId,
        carreraId,
        contrasena: clave,
      });

      setRegistroExitoso(true);
    } catch (error: unknown) {
      setErrorRegistro(obtenerMensajeError(error, 'No pudimos crear tu cuenta. Reintenta.'));
    } finally {
      setCreandoCuenta(false);
    }
  };

  const continuar = () => {
    if (paso === 0) {
      void validarCuentaYAvanzar();
      return;
    }

    if (paso === 1) {
      validarDatosYAvanzar();
      return;
    }

    if (paso === 2) {
      validarCarreraYAvanzar();
    }
  };

  const retroceder = () => setPaso((prev) => Math.max(prev - 1, 0));
  const irAPaso = (destino: number) => {
    if (destino <= maxVisitado && !validandoCuenta && !creandoCuenta) setPaso(destino);
  };

  const nombreResumen = [datos.pNombre, datos.pApellido].filter(Boolean).join(' ');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <LogoPD />
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Únete al marketplace universitario</Text>

          <Stepper
            actual={paso}
            maxVisitado={maxVisitado}
            respondidos={[paso > 0, paso > 1, paso > 2, aceptaTerminos]}
            onIr={irAPaso}
          />

          {paso === 0 ? (
            <StepCuentaGrafico
              run={run}
              correo={correo}
              errorRun={errorRun}
              errorCorreo={errorCorreo}
              deshabilitado={validandoCuenta}
              onRunChange={(valor) => {
                setRun(formatearRunEnEscritura(valor));
                setErrorRun(undefined);
              }}
              onRunBlur={() => setRun((valor) => formatearRun(valor))}
              onCorreoChange={(valor) => {
                setCorreo(valor);
                setErrorCorreo(undefined);
              }}
            />
          ) : null}
          {paso === 1 ? (
            <StepDatosGrafico
              datos={datos}
              errorTelefono={errorTelefono}
              onChange={(parcial) => {
                const telefono =
                  parcial.telefono === undefined
                    ? undefined
                    : formatearTelefonoChile(parcial.telefono);

                setDatos((prev) => ({
                  ...prev,
                  ...parcial,
                  ...(parcial.telefono === undefined ? {} : { telefono }),
                }));
                if (parcial.telefono !== undefined) setErrorTelefono(undefined);
              }}
            />
          ) : null}
          {paso === 2 ? (
            <StepCarreraGrafico
              sedeId={sedeId}
              escuelaId={escuelaId}
              carreraId={carreraId}
              onSedeChange={setSedeId}
              onEscuelaChange={setEscuelaId}
              onCarreraChange={(id) => setCarreraId(id || undefined)}
            />
          ) : null}
          {paso === 3 ? (
            <StepClaveGrafico
              run={run}
              correo={correo}
              nombreResumen={nombreResumen}
              clave={clave}
              confirmacion={confirmacion}
              aceptaTerminos={aceptaTerminos}
              errorClave={errorClave}
              errorConfirmacion={errorConfirmacion}
              errorTerminos={errorTerminos}
              errorRegistro={errorRegistro}
              deshabilitado={creandoCuenta}
              onClaveChange={(valor) => {
                setClave(valor);
                setErrorClave(undefined);
                setErrorConfirmacion(undefined);
                setErrorRegistro(undefined);
              }}
              onConfirmacionChange={(valor) => {
                setConfirmacion(valor);
                setErrorConfirmacion(undefined);
                setErrorRegistro(undefined);
              }}
              onAbrirTerminos={() => setModalAbierto(true)}
            />
          ) : null}

          <View style={styles.bar}>
            {paso > 0 ? (
              <Pressable
                accessibilityRole="button"
                disabled={validandoCuenta || creandoCuenta}
                onPress={retroceder}
                style={[styles.btn, styles.sec]}>
                <Text style={styles.secText}>Atrás</Text>
              </Pressable>
            ) : null}
            {paso < 3 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: validandoCuenta, busy: validandoCuenta }}
                disabled={validandoCuenta}
                onPress={continuar}
                style={[styles.btn, styles.pri, styles.flex, validandoCuenta && styles.btnDisabled]}>
                {validandoCuenta ? (
                  <View style={styles.btnContenido}>
                    <ActivityIndicator color={colors.navy} size="small" />
                    <Text style={styles.priText}>Validando…</Text>
                  </View>
                ) : (
                  <Text style={styles.priText}>Continuar</Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: creandoCuenta, busy: creandoCuenta }}
                disabled={creandoCuenta}
                onPress={() => void registrar()}
                style={[styles.btn, styles.pri, styles.flex, creandoCuenta && styles.btnDisabled]}>
                {creandoCuenta ? (
                  <View style={styles.btnContenido}>
                    <ActivityIndicator color={colors.navy} size="small" />
                    <Text style={styles.priText}>Creando cuenta…</Text>
                  </View>
                ) : (
                  <Text style={styles.priText}>Crear cuenta</Text>
                )}
              </Pressable>
            )}
          </View>

          <View style={styles.row}>
            <Text style={styles.muted}>¿Ya tienes cuenta? </Text>
            <Link href="/auth/login" style={styles.link}>
              Inicia sesión
            </Link>
          </View>
        </View>
      </ScrollView>

      <RegistroExitosoModal
        visible={registroExitoso}
        onIniciarSesion={() => {
          setRegistroExitoso(false);
          router.replace('/auth/login');
        }}
      />

      <TermsModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onAceptar={() => {
          setAceptaTerminos(true);
          setErrorTerminos(undefined);
          setModalAbierto(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.padSm, flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusLg,
    padding: spacing.padLg,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.navy, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  bar: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    borderRadius: spacing.radiusMd,
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  pri: { backgroundColor: colors.gold },
  sec: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnDisabled: { opacity: 0.7 },
  btnContenido: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priText: { color: colors.navy, fontWeight: '700', fontSize: 16 },
  secText: { color: colors.navy, fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  muted: { color: colors.muted, fontSize: 14 },
  link: { color: colors.navy, fontWeight: '700', fontSize: 14 },
});
