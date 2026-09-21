import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';
import { LogoPD } from '@/components/auth/LogoPD';
import { StepCarreraGrafico } from '@/components/auth/StepCarreraGrafico';
import { StepClaveGrafico } from '@/components/auth/StepClaveGrafico';
import { StepCuentaGrafico } from '@/components/auth/StepCuentaGrafico';
import { StepDatosGrafico, type DatosGrafico } from '@/components/auth/StepDatosGrafico';
import { Stepper } from '@/components/auth/Stepper';
import { TermsModal } from '@/components/auth/TermsModal';

// Espejo gráfico de front/components/register/RegisterWizard.tsx.
// Sin hooks de verificación, sin mutación, sin mapper. Solo memoria local.
export default function RegisterScreen() {
  const [paso, setPaso] = useState(0);
  const [maxVisitado, setMaxVisitado] = useState(0);
  const [run, setRun] = useState('');
  const [correo, setCorreo] = useState('');
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

  const avanzar = () => {
    const siguiente = Math.min(paso + 1, 3);
    setPaso(siguiente);
    setMaxVisitado((prev) => Math.max(prev, siguiente));
  };
  const retroceder = () => setPaso((prev) => Math.max(prev - 1, 0));
  const irAPaso = (destino: number) => {
    if (destino <= maxVisitado) setPaso(destino);
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
            <StepCuentaGrafico run={run} correo={correo} onRunChange={setRun} onCorreoChange={setCorreo} />
          ) : null}
          {paso === 1 ? (
            <StepDatosGrafico datos={datos} onChange={(p) => setDatos((prev) => ({ ...prev, ...p }))} />
          ) : null}
          {paso === 2 ? <StepCarreraGrafico /> : null}
          {paso === 3 ? (
            <StepClaveGrafico
              run={run}
              correo={correo}
              nombreResumen={nombreResumen}
              clave={clave}
              confirmacion={confirmacion}
              aceptaTerminos={aceptaTerminos}
              onClaveChange={setClave}
              onConfirmacionChange={setConfirmacion}
              onAbrirTerminos={() => setModalAbierto(true)}
            />
          ) : null}

          <View style={styles.bar}>
            {paso > 0 ? (
              <Pressable accessibilityRole="button" onPress={retroceder} style={[styles.btn, styles.sec]}>
                <Text style={styles.secText}>Atrás</Text>
              </Pressable>
            ) : null}
            {paso < 3 ? (
              <Pressable accessibilityRole="button" onPress={avanzar} style={[styles.btn, styles.pri, styles.flex]}>
                <Text style={styles.priText}>Continuar</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => Alert.alert('Solo gráfico', 'Crear cuenta sin conexión al back.')}
                style={[styles.btn, styles.pri, styles.flex]}>
                <Text style={styles.priText}>Crear cuenta</Text>
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

      <TermsModal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onAceptar={() => {
          setAceptaTerminos(true);
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
  priText: { color: colors.navy, fontWeight: '700', fontSize: 16 },
  secText: { color: colors.navy, fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  muted: { color: colors.muted, fontSize: 14 },
  link: { color: colors.navy, fontWeight: '700', fontSize: 14 },
});
