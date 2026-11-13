import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolverAdvertenciaReporteUsuarioDto {
  @ApiProperty({
    description:
      'Mensaje de advertencia que quedará registrado en el reporte (no envía notificación en esta HU)',
    example: 'Se detectó una conducta indebida. A la próxima se aplicará bloqueo.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El mensaje de advertencia es requerido' })
  @MinLength(3, { message: 'El mensaje de advertencia es requerido' })
  mensaje: string;
}
