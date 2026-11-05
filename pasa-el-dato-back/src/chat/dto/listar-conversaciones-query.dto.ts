import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListarConversacionesQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor de paginación (opaco). Si se omite, devuelve la primera página.',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description:
      'Tamaño de página. Recomendado: 20 web / 10 mobile. Máximo 50.',
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
