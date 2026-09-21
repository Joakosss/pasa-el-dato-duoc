// Espejo gráfico de pasa-el-dato-front/app/globals.css @theme.
// Solo tokens visuales. Sin lógica, sin red.
export const colors = {
  navy: '#002b49',
  gold: '#ffc72c',
  goldHover: '#e6b326',
  surface: '#f9fafb',
  card: '#ffffff',
  muted: '#9ca3af',
  border: '#e5e7eb',
  error: '#ef4444',
  success: '#16a34a',
  inputBg: '#ffffff',
  placeholder: '#d1d5b3',
} as const;

export type AppColors = typeof colors;
