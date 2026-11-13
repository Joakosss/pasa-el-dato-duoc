import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

// Iniciales del nombre dentro de un círculo. Espejo del Avatar web, que se usa
// tanto en las tarjetas del feed como en las de chat.
function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((parte) => parte[0]?.toUpperCase() ?? '').join('');
}

export function Avatar({ nombre, tamano = 40 }: { nombre: string; tamano?: number }) {
  const letras = iniciales(nombre);

  return (
    <View
      style={[
        styles.circulo,
        { width: tamano, height: tamano, borderRadius: tamano / 2 },
      ]}>
      {letras ? (
        <Text style={[styles.texto, { fontSize: Math.round(tamano * 0.42) }]}>
          {letras}
        </Text>
      ) : (
        <Image
          accessibilityLabel="Logo Pasa el Dato Duoc"
          source={require('../../../assets/images/logo-ui.png')}
          style={styles.logo}
        />
      )}
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
  logo: {
    height: '82%',
    resizeMode: 'contain',
    width: '82%',
  },
});
