import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AnalisisIaPublicacion } from '@/lib/api/ia-publicaciones';
import { colors, spacing } from '@/theme';

interface AsistenteIaPublicacionProps {
  analisis?: AnalisisIaPublicacion;
  cargando: boolean;
  error?: string;
  deshabilitado: boolean;
  puedeAnalizar: boolean;
  onAnalizar: () => void;
  onAplicarTitulo: () => void;
  onAplicarDescripcion: () => void;
}

const CONFIGURACION_ESTADO = {
  APTA: {
    color: '#15803d',
    fondo: '#f0fdf4',
    icono: 'check-decagram-outline' as const,
    titulo: 'Apta para publicar',
  },
  REQUIERE_AJUSTES: {
    color: '#a16207',
    fondo: '#fffbeb',
    icono: 'alert-outline' as const,
    titulo: 'Requiere ajustes',
  },
  BLOQUEADA: {
    color: colors.error,
    fondo: '#fef2f2',
    icono: 'close-octagon-outline' as const,
    titulo: 'No se recomienda publicar',
  },
};

export function AsistenteIaPublicacion({
  analisis,
  cargando,
  error,
  deshabilitado,
  puedeAnalizar,
  onAnalizar,
  onAplicarTitulo,
  onAplicarDescripcion,
}: AsistenteIaPublicacionProps) {
  const configuracion = analisis
    ? CONFIGURACION_ESTADO[analisis.estadoModeracion]
    : undefined;

  return (
    <View style={styles.tarjeta}>
      <View style={styles.encabezado}>
        <View style={styles.icono}>
          <MaterialCommunityIcons name="creation-outline" size={22} color={colors.gold} />
        </View>
        <View style={styles.encabezadoTexto}>
          <Text style={styles.titulo}>Asistente IA</Text>
          <Text style={styles.subtitulo}>Calidad, seguridad y mejoras para tu publicación</Text>
        </View>
      </View>

      <Text style={styles.privacidad}>
        Gemini analiza temporalmente tu texto e imágenes para entregarte sugerencias. Tú decides si las aplicas.
      </Text>

      {analisis && configuracion ? (
        <View style={styles.resultado}>
          <View style={[styles.estado, { backgroundColor: configuracion.fondo }]}>
            <MaterialCommunityIcons name={configuracion.icono} size={20} color={configuracion.color} />
            <View style={styles.estadoTexto}>
              <Text style={[styles.estadoTitulo, { color: configuracion.color }]}>
                {configuracion.titulo}
              </Text>
              <Text style={styles.puntaje}>Calidad: {analisis.puntajeCalidad}/100</Text>
            </View>
          </View>

          <Text style={styles.resumen}>{analisis.resumen}</Text>

          {analisis.hallazgos.length ? (
            <Seccion titulo="Hallazgos" icono="magnify">
              {analisis.hallazgos.map((hallazgo) => (
                <Elemento key={hallazgo} texto={hallazgo} color={colors.error} />
              ))}
            </Seccion>
          ) : null}

          {analisis.sugerencias.length ? (
            <Seccion titulo="Sugerencias" icono="lightbulb-outline">
              {analisis.sugerencias.map((sugerencia) => (
                <Elemento key={sugerencia} texto={sugerencia} color={colors.navy} />
              ))}
            </Seccion>
          ) : null}

          {analisis.tituloSugerido ? (
            <Pressable
              accessibilityRole="button"
              disabled={deshabilitado}
              onPress={onAplicarTitulo}
              style={({ pressed }) => [
                styles.aplicar,
                deshabilitado && styles.deshabilitado,
                pressed && styles.pressed,
              ]}>
              <MaterialCommunityIcons name="format-title" size={17} color={colors.navy} />
              <Text style={styles.aplicarTexto}>Aplicar título sugerido</Text>
            </Pressable>
          ) : null}

          {analisis.descripcionSugerida ? (
            <Pressable
              accessibilityRole="button"
              disabled={deshabilitado}
              onPress={onAplicarDescripcion}
              style={({ pressed }) => [
                styles.aplicar,
                deshabilitado && styles.deshabilitado,
                pressed && styles.pressed,
              ]}>
              <MaterialCommunityIcons name="text-box-edit-outline" size={17} color={colors.navy} />
              <Text style={styles.aplicarTexto}>Aplicar descripción sugerida</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: deshabilitado || !puedeAnalizar, busy: cargando }}
        disabled={deshabilitado || !puedeAnalizar}
        onPress={onAnalizar}
        style={({ pressed }) => [
          styles.accion,
          (deshabilitado || !puedeAnalizar) && styles.deshabilitado,
          pressed && styles.pressed,
        ]}>
        {cargando ? (
          <>
            <ActivityIndicator color={colors.gold} size="small" />
            <Text style={styles.accionTexto}>Analizando con Gemini…</Text>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="creation-outline" size={18} color={colors.gold} />
            <Text style={styles.accionTexto}>
              {analisis ? 'Analizar nuevamente' : 'Analizar con IA'}
            </Text>
          </>
        )}
      </Pressable>

      {!puedeAnalizar ? (
        <Text style={styles.ayuda}>Completa título y descripción para usar el asistente.</Text>
      ) : null}
    </View>
  );
}

function Seccion({
  titulo,
  icono,
  children,
}: {
  titulo: string;
  icono: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionTitulo}>
        <MaterialCommunityIcons name={icono} size={16} color={colors.navy} />
        <Text style={styles.seccionTituloTexto}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

function Elemento({ texto, color }: { texto: string; color: string }) {
  return (
    <View style={styles.elemento}>
      <View style={[styles.punto, { backgroundColor: color }]} />
      <Text style={styles.elementoTexto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#f8fafc',
    borderColor: colors.navy,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padSm,
    padding: spacing.padMd,
  },
  encabezado: { alignItems: 'center', flexDirection: 'row', gap: spacing.padSm },
  icono: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  encabezadoTexto: { flex: 1 },
  titulo: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  subtitulo: { color: colors.muted, fontSize: 12, marginTop: 2 },
  privacidad: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  resultado: { gap: spacing.padSm },
  estado: { alignItems: 'center', borderRadius: spacing.radiusMd, flexDirection: 'row', gap: 9, padding: spacing.padSm },
  estadoTexto: { flex: 1 },
  estadoTitulo: { fontSize: 14, fontWeight: '800' },
  puntaje: { color: colors.navy, fontSize: 12, fontWeight: '600', marginTop: 2 },
  resumen: { color: colors.navy, fontSize: 13, lineHeight: 19 },
  seccion: { gap: 5 },
  seccionTitulo: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  seccionTituloTexto: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  elemento: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 },
  punto: { borderRadius: 3, height: 6, marginTop: 6, width: 6 },
  elementoTexto: { color: colors.navy, flex: 1, fontSize: 12, lineHeight: 17 },
  aplicar: {
    alignItems: 'center',
    backgroundColor: '#fff8dc',
    borderColor: colors.gold,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.padSm,
  },
  aplicarTexto: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  accion: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: spacing.radiusMd,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
    paddingHorizontal: spacing.padMd,
  },
  accionTexto: { color: colors.gold, fontSize: 14, fontWeight: '800' },
  ayuda: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  error: { color: colors.error, fontSize: 13 },
  deshabilitado: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
});
