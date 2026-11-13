import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RetirarPublicacionReportePublicacionDto {
  @ApiPropertyOptional({ example: 'Retiro por incumplimiento de normativa institucional.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivo?: string;
}
