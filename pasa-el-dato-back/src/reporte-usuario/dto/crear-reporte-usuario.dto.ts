import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CrearReporteUsuarioDto {
  @ApiProperty({
    description: 'Descripción del motivo por el que se reporta al usuario.',
    example: 'Comportamiento sospechoso: solicitó continuar la conversación fuera de la aplicación.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  descripcion!: string;
}
