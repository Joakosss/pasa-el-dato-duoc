import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ListarCarrerasQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la escuela por la que se filtrarán las carreras',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'escuelaId debe ser un número entero' })
  @Min(1, { message: 'escuelaId debe ser mayor o igual a 1' })
  escuelaId?: number;
}
