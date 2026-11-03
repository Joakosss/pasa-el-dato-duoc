import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

// Parámetros aditivos de GET /sedes: sin parámetros el comportamiento es el
// histórico (sin filtros).
export class ListarSedesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la comuna por la que se filtrarán las sedes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'comunaId debe ser un número entero' })
  @Min(1, { message: 'comunaId debe ser mayor o igual a 1' })
  comunaId?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Si es true, devuelve solo sedes activas y no eliminadas (soloDisponibles=true)',
  })
  @IsOptional()
  // Solo el literal "true" activa el filtro; cualquier otro valor es false.
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'soloDisponibles debe ser true o false' })
  soloDisponibles?: boolean;
}
