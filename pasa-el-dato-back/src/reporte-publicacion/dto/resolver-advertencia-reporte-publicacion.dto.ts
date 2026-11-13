import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResolverAdvertenciaReportePublicacionDto {
  @ApiProperty({ example: 'La publicación incumple las normas del catálogo.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  mensaje!: string;
}
