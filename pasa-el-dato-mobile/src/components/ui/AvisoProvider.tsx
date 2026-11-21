import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

interface Aviso {
  titulo: string;
  mensaje: string;
}

type MostrarAviso = (titulo: string, mensaje: string) => void;

const AvisoContext = createContext<MostrarAviso | null>(null);

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const mostrarAviso = useCallback((titulo: string, mensaje: string) => {
    setAviso({ titulo, mensaje });
  }, []);
  const cerrar = useCallback(() => setAviso(null), []);

  return (
    <AvisoContext.Provider value={mostrarAviso}>
      {children}
      <Modal visible={aviso !== null} transparent animationType="fade" onRequestClose={cerrar}>
        <View style={styles.overlay}>
          <View style={styles.caja} accessibilityViewIsModal>
            <View style={styles.icono}>
              <MaterialCommunityIcons name="information-outline" size={30} color={colors.navy} />
            </View>
            <Text accessibilityRole="header" style={styles.titulo}>{aviso?.titulo}</Text>
            <ScrollView style={styles.contenido} contentContainerStyle={styles.contenidoInterior}>
              <Text style={styles.mensaje}>{aviso?.mensaje}</Text>
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={cerrar}
              style={({ pressed }) => [styles.boton, pressed && styles.presionado]}>
              <Text style={styles.botonTexto}>Entendido</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AvisoContext.Provider>
  );
}

export function useAviso(): MostrarAviso {
  const mostrarAviso = useContext(AvisoContext);
  if (!mostrarAviso) {
    throw new Error('useAviso requiere AvisoProvider');
  }
  return mostrarAviso;
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,43,73,0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.padLg,
  },
  caja: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    gap: spacing.padMd,
    maxHeight: '85%',
    maxWidth: 420,
    padding: spacing.padLg,
    width: '100%',
  },
  icono: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderColor: colors.navy,
    borderRadius: 32,
    borderWidth: 2,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  titulo: { color: colors.navy, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  contenido: { flexGrow: 0, width: '100%' },
  contenidoInterior: { alignItems: 'center' },
  mensaje: { color: colors.navy, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  boton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.gold,
    borderRadius: spacing.radiusMd,
    justifyContent: 'center',
    minHeight: spacing.touchMin,
  },
  botonTexto: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  presionado: { opacity: 0.9 },
});
