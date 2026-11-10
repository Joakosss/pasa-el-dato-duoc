import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class ListarCalificacionesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    default: 1,
    description: 'Número de página.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    example: 10,
    enum: [10, 20],
    default: 10,
    description: 'Cantidad de calificaciones por página.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20])
  pageSize = 10;
}
