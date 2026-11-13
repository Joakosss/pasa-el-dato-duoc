import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

interface EstrellasMomentaneoProps {
  valor: number;
  tamano?: number;
  editable?: boolean;
  onCambiar?: (valor: number) => void;
}

export function EstrellasMomentaneo({
  valor,
  tamano = 22,
  editable = false,
  onCambiar,
}: EstrellasMomentaneoProps) {
  return (
    <View style={styles.contenedor}>
      {Array.from({ length: 5 }, (_, indice) => {
        const estrella = indice + 1;
        const seleccionada = estrella <= valor;

        return (
          <Pressable
            key={estrella}
            accessibilityRole={editable ? 'button' : undefined}
            accessibilityLabel={
              editable ? `${estrella} ${estrella === 1 ? 'estrella' : 'estrellas'}` : undefined
            }
            disabled={!editable}
            onPress={() => onCambiar?.(estrella)}
            hitSlop={editable ? 6 : undefined}>
            <MaterialCommunityIcons
              name={seleccionada ? 'star' : 'star-outline'}
              size={tamano}
              color={seleccionada ? colors.gold : colors.border}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
