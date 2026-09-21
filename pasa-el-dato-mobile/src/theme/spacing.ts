// Radios, paddings y touch extraídos de las tarjetas AUTH web
// (rounded-2xl, p-8, h-12 logo, inputs h-12 aprox).
export const spacing = {
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  padSm: 12,
  padMd: 16,
  padLg: 24,
  touchMin: 44,
  logoSize: 48,
} as const;

export type AppSpacing = typeof spacing;
