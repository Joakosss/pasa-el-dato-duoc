import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class TipoVentaRespuestaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  id!: number;

  @ApiProperty({ example: 'Servicio' })
  @IsString()
  nombre!: string;
}
