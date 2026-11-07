import { EstadoBannerPublicidad } from '../../generated/prisma/enums.js';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListarBannersAdminQueryDto {
  @IsOptional()
  @IsEnum(EstadoBannerPublicidad)
  estado: EstadoBannerPublicidad = EstadoBannerPublicidad.PENDIENTE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
