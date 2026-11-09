import { IsIn } from 'class-validator';

export const ESTADOS_PUBLICACION_MOBILE = [
  'En curso',
  'Pausado',
  'Vendido',
] as const;

export class CambiarEstadoPublicacionMobileDto {
  @IsIn(ESTADOS_PUBLICACION_MOBILE)
  estado!: (typeof ESTADOS_PUBLICACION_MOBILE)[number];
}
