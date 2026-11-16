import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

// HU-REP-01 (BE02): contrato de lectura del catálogo de motivos.
export class MotivoReporteRespuestaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  id!: number;

  @ApiProperty({ example: 'Spam o publicidad engañosa' })
  @IsString()
  nombre!: string;
}
