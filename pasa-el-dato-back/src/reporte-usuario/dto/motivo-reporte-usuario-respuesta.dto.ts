import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

// HU-REP-02 (BE02): contrato de lectura del catálogo de motivos de usuario.
export class MotivoReporteUsuarioRespuestaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  id!: number;

  @ApiProperty({ example: 'Acoso o trato abusivo' })
  @IsString()
  nombre!: string;
}
