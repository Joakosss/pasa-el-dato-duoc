import { IsBoolean, Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EliminarCuentaDto {
  @ApiProperty({
    description:
      'Confirmación explícita requerida para eliminar lógicamente la cuenta propia.',
    example: true,
  })
  @IsBoolean()
  @Equals(true, { message: 'Confirmación requerida' })
  confirmacion!: true;
}
