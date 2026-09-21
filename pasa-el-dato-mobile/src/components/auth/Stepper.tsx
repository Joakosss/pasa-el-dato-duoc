import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import { PASOS_REGISTRO } from './steps';

interface StepperProps {
  actual: number;
  maxVisitado: number;
  respondidos: boolean[];
  onIr: (paso: number) => void;
}

// Espejo gráfico de front/components/register/Stepper.tsx.
export function Stepper({ actual, maxVisitado, respondidos, onIr }: StepperProps) {
  return (
    <View style={styles.row} accessibilityLabel="Progreso del registro">
      {PASOS_REGISTRO.map((nombre, i) => {
        const activo = i === actual;
        const respondido = respondidos[i] ?? false;
        const visitado = i <= maxVisitado;
        return (
          <View key={nombre} style={styles.item}>
            <Pressable
              accessibilityRole="button"
              disabled={!visitado}
              onPress={() => onIr(i)}
              style={styles.dotWrap}>
              <View
                style={[
                  styles.dot,
                  activo && styles.dotActivo,
                  !activo && respondido && styles.dotRespondido,
                ]}>
                <Text
                  style={[
                    styles.dotText,
                    activo && styles.dotTextActivo,
                    !activo && respondido && styles.dotTextRespondido,
                  ]}>
                  {!activo && respondido ? '✓' : String(i + 1)}
                </Text>
              </View>
              <Text style={[styles.label, (activo || respondido) && styles.labelActivo]}>
                {nombre}
              </Text>
            </Pressable>
            {i < PASOS_REGISTRO.length - 1 ? (
              <View style={[styles.line, respondidos[i] && styles.lineOk]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActivo: {
    backgroundColor: colors.gold,
  },
  dotRespondido: {
    backgroundColor: colors.navy,
  },
  dotText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  dotTextActivo: {
    color: colors.navy,
  },
  dotTextRespondido: {
    color: colors.gold,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  labelActivo: {
    color: colors.navy,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  lineOk: {
    backgroundColor: colors.navy,
  },
});
