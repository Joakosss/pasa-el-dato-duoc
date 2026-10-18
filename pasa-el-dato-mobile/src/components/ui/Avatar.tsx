import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

// Iniciales del nombre dentro de un círculo. Espejo del Avatar web, que se usa
// tanto en las tarjetas del feed como en las de chat.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const letras = partes.map((parte) => parte[0]?.toUpperCase() ?? '').join('');
  return letras || 'PD';
}

export function Avatar({ nombre, tamano = 40 }: { nombre: string; tamano?: number }) {
  return (
    <View
      style={[
        styles.circulo,
        { width: tamano, height: tamano, borderRadius: tamano / 2 },
      ]}>
      <Text style={[styles.texto, { fontSize: Math.round(tamano * 0.42) }]}>
        {iniciales(nombre)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texto: {
    color: colors.navy,
    fontWeight: '800',
  },
});
