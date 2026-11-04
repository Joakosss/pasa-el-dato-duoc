import { IsBoolean, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DesactivarCuentaDto {
  @ApiProperty({
    description:
      'Confirmación explícita requerida para desactivar la cuenta propia.',
    example: true,
  })
  @IsBoolean()
  @Equals(true, { message: 'Confirmación requerida' })
  confirmacion!: true;
}
