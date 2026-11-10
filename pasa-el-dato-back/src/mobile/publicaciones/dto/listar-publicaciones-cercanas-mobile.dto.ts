import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ListarPublicacionesCercanasMobileDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'latitud debe ser un número válido' })
  @IsLatitude({ message: 'latitud debe estar entre -90 y 90' })
  latitud: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'longitud debe ser un número válido' })
  @IsLongitude({ message: 'longitud debe estar entre -180 y 180' })
  longitud: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'radioKm debe ser un número válido' })
  @Min(1, { message: 'radioKm debe ser al menos 1 km' })
  @Max(200, { message: 'radioKm no puede superar 200 km' })
  radioKm?: number;
}
