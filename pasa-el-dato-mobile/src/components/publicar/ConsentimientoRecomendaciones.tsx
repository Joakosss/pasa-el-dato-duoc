import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  autorizarConsentimientoIa,
  obtenerConsentimientoIa,
  retirarConsentimientoIa,
  type EstadoConsentimientoIa,
} from '@/lib/api/consentimiento-ia';
import { colors, spacing } from '@/theme';

interface Props {
  id: string;
  titulo: string;
  descripcion: string;
  accessToken: string;
}

export function ConsentimientoRecomendaciones({ id, titulo, descripcion, accessToken }: Props) {
  const [estado, setEstado] = useState<EstadoConsentimientoIa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setEstado(await obtenerConsentimientoIa(id, accessToken));
    } catch {
      setError('No pudimos consultar la autorización. Inténtalo nuevamente.');
    }
  }, [id, accessToken]);

  useEffect(() => {
    let vigente = true;
    void obtenerConsentimientoIa(id, accessToken)
      .then((resultado) => { if (vigente) setEstado(resultado); })
      .catch(() => { if (vigente) setError('No pudimos consultar la autorización. Inténtalo nuevamente.'); });
    return () => { vigente = false; };
  }, [id, accessToken]);

  const autorizar = async () => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      setEstado(await autorizarConsentimientoIa(id, titulo, descripcion, accessToken));
      setConfirmar(false);
    } catch {
      setConfirmar(false);
      await cargar();
      setError('No pudimos completar el procesamiento. El permiso pudo quedar registrado; puedes retirarlo o reintentar.');
    } finally {
      setOcupado(false);
    }
  };

  const retirar = async () => {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      setEstado(await retirarConsentimientoIa(id, accessToken));
    } catch {
      setError('No pudimos retirar el permiso. Inténtalo nuevamente.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.titulo}>Recomendaciones con IA</Text>
      <Text style={styles.texto}>
        Opcional: autoriza enviar el título y la descripción de esta publicación a Google Gemini para mejorar recomendaciones.
        Google puede usar los datos del nivel gratuito para mejorar sus productos y aplicar revisión humana.
        No incluyas datos personales o sensibles. No se envían imágenes.
      </Text>
      {estado ? (
        <Text style={styles.texto}>
          {estado.disponible ? 'Autorización vigente y procesamiento completado.' :
            estado.registrado ? 'Hay un permiso registrado, pero el texto actual no está procesado.' :
              'Esta publicación no está autorizada.'}
        </Text>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {ocupado ? <ActivityIndicator color={colors.navy} /> : (
        <View style={styles.acciones}>
          {!estado ? (
            <Pressable accessibilityRole="button" onPress={() => void cargar()} style={styles.boton}>
              <Text style={styles.botonTexto}>Reintentar</Text>
            </Pressable>
          ) : (
            <>
              {!estado.disponible ? (
                <Pressable accessibilityRole="button" onPress={() => setConfirmar(true)} style={styles.boton}>
                  <Text style={styles.botonTexto}>Autorizar texto actual</Text>
                </Pressable>
              ) : null}
              {estado.registrado ? (
                <Pressable accessibilityRole="button" onPress={() => void retirar()} style={styles.boton}>
                  <Text style={styles.botonTexto}>Retirar autorización</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      )}
      <Modal visible={confirmar} transparent animationType="fade" onRequestClose={() => !ocupado && setConfirmar(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text accessibilityRole="header" style={styles.titulo}>¿Autorizar el procesamiento?</Text>
            <Text style={styles.texto}>
              Se enviarán a Google el título y la descripción actuales para generar un vector de recomendaciones.
              Puedes retirar el permiso después: se elimina el vector local, pero una solicitud ya iniciada podría llegar a Google y no se recuperan los datos enviados.
            </Text>
            <ScrollView style={styles.contenidoConfirmacion}>
              <Text style={styles.texto}>Título: {titulo}</Text>
              <Text style={styles.texto}>Descripción: {descripcion}</Text>
            </ScrollView>
            <View style={styles.acciones}>
              <Pressable accessibilityRole="button" disabled={ocupado} onPress={() => setConfirmar(false)} style={styles.boton}>
                <Text style={styles.botonTexto}>Cancelar</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={ocupado} onPress={() => void autorizar()} style={styles.boton}>
                <Text style={styles.botonTexto}>Confirmar envío</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: spacing.radiusMd, padding: spacing.padMd, gap: 8 },
  titulo: { color: colors.navy, fontWeight: '700', fontSize: 16 },
  texto: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  error: { color: colors.error, fontSize: 13 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  boton: { backgroundColor: colors.gold, borderRadius: spacing.radiusSm, padding: 10 },
  botonTexto: { color: colors.navy, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: spacing.padLg },
  modal: { backgroundColor: colors.card, borderRadius: spacing.radiusLg, padding: spacing.padLg, gap: 10, maxHeight: '90%' },
  contenidoConfirmacion: { flexShrink: 1 },
});
