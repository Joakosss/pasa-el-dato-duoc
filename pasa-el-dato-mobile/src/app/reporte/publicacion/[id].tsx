import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

const MOTIVOS_REPORTE_MOMENTANEO = [
  {
    id: 'contenido-prohibido',
    titulo: 'Producto o servicio prohibido',
    descripcion: 'Incluye artículos, servicios o contenido que no está permitido.',
    icono: 'cancel' as const,
  },
  {
    id: 'publicacion-sospechosa',
    titulo: 'Publicación sospechosa o posible estafa',
    descripcion: 'El precio, las imágenes o la información parecen engañosos.',
    icono: 'shield-alert-outline' as const,
  },
  {
    id: 'informacion-falsa',
    titulo: 'Información falsa o engañosa',
    descripcion: 'La descripción no corresponde a lo ofrecido.',
    icono: 'text-box-remove-outline' as const,
  },
  {
    id: 'imagen-inadecuada',
    titulo: 'Imágenes inapropiadas o de terceros',
    descripcion: 'Las imágenes vulneran normas, privacidad o derechos de autor.',
    icono: 'image-off-outline' as const,
  },
  {
    id: 'spam-duplicado',
    titulo: 'Spam o publicación duplicada',
    descripcion: 'La publicación se repite o se utiliza con fines no permitidos.',
    icono: 'content-copy' as const,
  },
  {
    id: 'otro',
    titulo: 'Otro motivo',
    descripcion: 'Describe con más detalle la situación para que podamos revisarla.',
    icono: 'dots-horizontal-circle-outline' as const,
  },
] as const;

type MotivoReporteMomentaneoId = (typeof MOTIVOS_REPORTE_MOMENTANEO)[number]['id'];

export default function ReportarPublicacionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [motivo, setMotivo] = useState<MotivoReporteMomentaneoId | undefined>();
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);

  const motivoSeleccionado = MOTIVOS_REPORTE_MOMENTANEO.find(
    (opcion) => opcion.id === motivo,
  );

  const enviarReporteMomentaneo = () => {
    if (!motivo) {
      setError('Selecciona un motivo para continuar.');
      return;
    }

    if (motivo === 'otro' && detalle.trim().length < 10) {
      setError('Describe el motivo con al menos 10 caracteres.');
      return;
    }

    setError(undefined);
    setConfirmacionVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.barra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al detalle"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace({ pathname: '/producto/[id]', params: { id } });
          }}
          style={styles.volver}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.barraTitulo}>Reportar publicación</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.aviso}>
          <MaterialCommunityIcons name="shield-alert-outline" size={25} color={colors.error} />
          <View style={styles.avisoTexto}>
            <Text style={styles.avisoTitulo}>Ayúdanos a cuidar la comunidad</Text>
            <Text style={styles.avisoDescripcion}>
              Reporta solo publicaciones que incumplan las normas o parezcan sospechosas.
              Nuestro equipo revisará el caso.
            </Text>
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.etiqueta}>¿Cuál es el problema? *</Text>
          <Text style={styles.ayuda}>Elige la opción que mejor describa la situación.</Text>

          <View style={styles.motivos}>
            {MOTIVOS_REPORTE_MOMENTANEO.map((opcion) => {
              const seleccionado = motivo === opcion.id;

              return (
                <Pressable
                  key={opcion.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: seleccionado }}
                  onPress={() => {
                    setMotivo(opcion.id);
                    setError(undefined);
                  }}
                  style={[styles.motivo, seleccionado && styles.motivoSeleccionado]}>
                  <View
                    style={[
                      styles.iconoMotivo,
                      seleccionado && styles.iconoMotivoSeleccionado,
                    ]}>
                    <MaterialCommunityIcons
                      name={opcion.icono}
                      size={22}
                      color={seleccionado ? colors.gold : colors.navy}
                    />
                  </View>
                  <View style={styles.motivoTexto}>
                    <Text style={styles.motivoTitulo}>{opcion.titulo}</Text>
                    <Text style={styles.motivoDescripcion}>{opcion.descripcion}</Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      seleccionado && styles.radioSeleccionado,
                    ]}>
                    {seleccionado ? <View style={styles.radioInterior} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.seccion}>
          <View style={styles.encabezadoCampo}>
            <Text style={styles.etiqueta}>Información adicional</Text>
            <Text style={styles.contador}>{detalle.length}/500</Text>
          </View>
          <TextInput
            value={detalle}
            onChangeText={(valor) => {
              setDetalle(valor);
              setError(undefined);
            }}
            placeholder={
              motivoSeleccionado?.id === 'otro'
                ? 'Cuéntanos qué ocurrió…'
                : 'Agrega detalles que ayuden a revisar el caso (opcional).'
            }
            placeholderTextColor={colors.muted}
            maxLength={500}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />
        </View>

        <View style={styles.nota}>
          <MaterialCommunityIcons name="lock-outline" size={16} color={colors.muted} />
          <Text style={styles.notaTexto}>
            Tu identidad no será compartida con la persona que publicó el aviso.
          </Text>
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={enviarReporteMomentaneo}
          style={({ pressed }) => [styles.botonEnviar, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="flag-outline" size={19} color={colors.card} />
          <Text style={styles.botonEnviarTexto}>Enviar reporte</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={confirmacionVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.iconoExito}>
              <MaterialCommunityIcons name="check" size={38} color={colors.navy} />
            </View>
            <Text style={styles.modalTitulo}>Reporte preparado</Text>
            <Text style={styles.modalTexto}>
              Gracias por ayudar a mantener una comunidad segura. Esta vista es temporal:
              el envío real a moderación se conectará cuando esté disponible el contrato de
              reportes.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConfirmacionVisible(false);
                router.replace({ pathname: '/producto/[id]', params: { id } });
              }}
              style={styles.botonListo}>
              <Text style={styles.botonListoTexto}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    minHeight: 58,
    paddingHorizontal: spacing.padSm,
  },
  volver: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  barraTitulo: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  contenido: { gap: spacing.padMd, padding: spacing.padMd, paddingBottom: spacing.padLg },
  aviso: {
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderColor: colors.error,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.padSm,
    padding: spacing.padMd,
  },
  avisoTexto: { flex: 1, gap: 3 },
  avisoTitulo: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  avisoDescripcion: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  seccion: { gap: 8 },
  etiqueta: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  ayuda: { color: colors.muted, fontSize: 12, marginTop: -4 },
  motivos: { gap: 8 },
  motivo: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.padSm,
    padding: spacing.padSm,
  },
  motivoSeleccionado: { borderColor: colors.navy, borderWidth: 2 },
  iconoMotivo: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconoMotivoSeleccionado: { backgroundColor: colors.navy },
  motivoTexto: { flex: 1, gap: 2 },
  motivoTitulo: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  motivoDescripcion: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioSeleccionado: { borderColor: colors.navy },
  radioInterior: { backgroundColor: colors.navy, borderRadius: 5, height: 10, width: 10 },
  encabezadoCampo: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  contador: { color: colors.muted, fontSize: 12 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    color: colors.navy,
    fontSize: 14,
    minHeight: 120,
    padding: spacing.padSm,
  },
  nota: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  notaTexto: { color: colors.muted, flex: 1, fontSize: 12, lineHeight: 16 },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  botonEnviar: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonEnviarTexto: { color: colors.card, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.9 },
  overlay: { backgroundColor: 'rgba(0,43,73,0.6)', flex: 1, justifyContent: 'center', padding: spacing.padLg },
  modal: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padMd,
    padding: spacing.padLg,
  },
  iconoExito: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  modalTitulo: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  modalTexto: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  botonListo: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
    width: '100%',
  },
  botonListoTexto: { color: colors.navy, fontSize: 15, fontWeight: '800' },
});
