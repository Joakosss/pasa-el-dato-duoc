import { EstadoBannerPublicidad } from '../../generated/prisma/enums.js';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

// Query de GET /publicidad/banners (listado propio de la marca). `estado` es
// opcional: sin él se devuelven los banners de todos los estados.
export class ListarBannersMarcaQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @IsEnum(EstadoBannerPublicidad)
  estado?: EstadoBannerPublicidad;
}
