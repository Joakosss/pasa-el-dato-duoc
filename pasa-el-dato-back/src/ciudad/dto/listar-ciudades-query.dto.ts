import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ListarCiudadesQueryDto {
  @ApiProperty({
    example: 1,
    description:
      'ID de la región por la que se filtrarán las ciudades (obligatorio)',
  })
  // Sin IsOptional: regionId es obligatorio y su ausencia produce 400.
  @Type(() => Number)
  @IsInt({ message: 'regionId debe ser un número entero' })
  @Min(1, { message: 'regionId debe ser mayor o igual a 1' })
  regionId: number;
}
