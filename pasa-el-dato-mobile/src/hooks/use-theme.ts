/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

// App siempre en claro: no se sigue el tema del SO.
export function useTheme() {
  return Colors.light;
}
