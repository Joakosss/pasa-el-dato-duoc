import { Transform } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';
import { ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO } from '../publicacion-estados.constantes.js';

// DTO para HU-PUB-04: cambio de estado por propietario.
// Se valida por descripción para evitar IDs fijos y acoplamiento al seed.
export class CambiarEstadoPublicacionDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El estado debe ser un texto' })
  @IsIn(ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO, {
    message: 'Estado inválido o no asignable por propietario',
  })
  estado: string;
}
