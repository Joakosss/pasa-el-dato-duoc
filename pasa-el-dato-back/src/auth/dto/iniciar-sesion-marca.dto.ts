import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

// El correo de una cuenta de marca NO requiere dominio institucional
// @duocuc.cl: la exigencia es exclusiva del registro/login de estudiantes
// (HU-MAR-01). Por eso este DTO omite @EsCorreoInstitucional.
export class IniciarSesionMarcaDto {
  @ApiProperty({
    example: 'contacto@marca.cl',
    description: 'Correo de la cuenta de marca (comercial o externo)',
  })
  @Transform(({ value }) => {
    // Si no es texto, lo dejamos igual para que @IsString lo rechace.
    if (typeof value !== 'string') {
      return value;
    }

    // Misma normalización que el login general y la creación de marcas.
    return value.trim().toLowerCase();
  })
  @IsString({
    message: 'El correo debe ser un texto',
  })
  @IsNotEmpty({
    message: 'El correo es obligatorio',
  })
  @IsEmail(
    {},
    {
      message: 'El correo no es válido',
    },
  )
  correo: string;

  @ApiProperty({
    example: 'clave123',
    description: 'Contraseña de la cuenta de marca',
  })
  @IsString({
    message: 'La contraseña debe ser un texto',
  })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria',
  })
  contrasena: string;
}
