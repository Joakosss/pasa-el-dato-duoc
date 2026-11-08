import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolverBloqueoReporteUsuarioDto {
  @ApiProperty({
    description: 'Motivo del bloqueo aplicado a la cuenta reportada',
    example: 'Conducta indebida reiterada',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El motivo de bloqueo es requerido' })
  @MinLength(3, { message: 'El motivo de bloqueo es requerido' })
  motivo: string;
}
