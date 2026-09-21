import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme';

// Logo PD: espejo del bloque web h-12 w-12 rounded-xl bg-navy + text-gold.
export function LogoPD() {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>PD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: spacing.logoSize,
    height: spacing.logoSize,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  text: {
    color: colors.gold,
    fontWeight: '800',
    fontSize: 18,
  },
});
