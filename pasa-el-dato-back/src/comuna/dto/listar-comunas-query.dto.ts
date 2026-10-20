import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ListarComunasQueryDto {
  @ApiProperty({
    example: 1,
    description:
      'ID de la ciudad por la que se filtrarán las comunas (obligatorio)',
  })
  // Sin IsOptional: ciudadId es obligatorio y su ausencia produce 400.
  @Type(() => Number)
  @IsInt({ message: 'ciudadId debe ser un número entero' })
  @Min(1, { message: 'ciudadId debe ser mayor o igual a 1' })
  ciudadId: number;
}
