import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CrearPalabraBloqueadaDto {
  @ApiProperty({
    description:
      'Término exacto que será bloqueado, sin variantes, tokenización ni eliminación de símbolos.',
    example: 'fraude',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  termino!: string;
}
