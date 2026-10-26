import { Transform } from 'class-transformer';
import {
  IsInt,
  IsString,
  Length,
  Min,
} from 'class-validator';

// Normaliza los campos de texto de multipart/form-data: recorta espacios.
// Los valores que no son texto serán rechazados por los validadores.
function recortarSiEsTexto({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

// Convierte textos numéricos de multipart/form-data en enteros.
// Un valor no numérico o con decimales produce NaN, que @IsInt rechaza.
function enteroSiEsNumerico({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return Number(value.trim());
}

// Datos de una nueva publicación (HU-PUB-01).
// Las imágenes se reciben aparte como archivos (T-06), no en este DTO.
export class CrearPublicacionDto {
  @Transform(recortarSiEsTexto)
  @IsString({ message: 'El título debe ser un texto' })
  @Length(5, 100, {
    message: 'El título debe tener entre 5 y 100 caracteres',
  })
  titulo: string;

  @Transform(recortarSiEsTexto)
  @IsString({ message: 'La descripción debe ser un texto' })
  @Length(20, 2000, {
    message: 'La descripción debe tener entre 20 y 2.000 caracteres',
  })
  descripcion: string;

  // Precio en CLP: entero, sin decimales y mayor que cero.
  // No existe "gratis" ni "a convenir" (HU-PUB-01).
  @Transform(enteroSiEsNumerico)
  @IsInt({ message: 'El precio debe ser un número entero en CLP' })
  @Min(1, { message: 'El precio debe ser mayor que cero' })
  precio: number;

  @Transform(enteroSiEsNumerico)
  @IsInt({ message: 'La sede debe ser un identificador numérico' })
  @Min(1, { message: 'La sede debe ser un identificador válido' })
  sedeId: number;

  @Transform(enteroSiEsNumerico)
  @IsInt({ message: 'El tipo de venta debe ser un identificador numérico' })
  @Min(1, { message: 'El tipo de venta debe ser un identificador válido' })
  tipoVentaId: number;

  @Transform(enteroSiEsNumerico)
  @IsInt({ message: 'La categoría debe ser un identificador numérico' })
  @Min(1, { message: 'La categoría debe ser un identificador válido' })
  categoriaId: number;
}
