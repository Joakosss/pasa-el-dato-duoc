import { Image, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

const TAMANO_LOGO_AUTH = Math.round((spacing.logoSize * 2) / 3 * 2);

export function LogoPD() {
  return (
    <View style={styles.box}>
      <Image
        accessibilityLabel="Logo Pasa el Dato Duoc"
        source={require('../../../assets/images/logo-ui.png')}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: TAMANO_LOGO_AUTH,
    height: TAMANO_LOGO_AUTH,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  image: {
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
});
