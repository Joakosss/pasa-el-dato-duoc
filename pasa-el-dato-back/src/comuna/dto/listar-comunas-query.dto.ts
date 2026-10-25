import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

// El servicio exige exactamente uno de los dos parámetros.
export class ListarComunasQueryDto {
  @ApiPropertyOptional({
    example: 13,
    description: 'ID de la región por la que se filtrarán las comunas',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'regionId debe ser un número entero' })
  @Min(1, { message: 'regionId debe ser mayor o igual a 1' })
  regionId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID de la ciudad por la que se filtrarán las comunas',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ciudadId debe ser un número entero' })
  @Min(1, { message: 'ciudadId debe ser mayor o igual a 1' })
  ciudadId?: number;
}
