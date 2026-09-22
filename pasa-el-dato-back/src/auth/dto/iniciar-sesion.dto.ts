import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { EsCorreoInstitucional } from '../../common/validators/correo-institucional.validator.js';

export class IniciarSesionDto {
  @ApiProperty({
    example: 'alumno@duocuc.cl',
    description: 'Correo institucional del usuario',
  })
  @Transform(({ value }) => {
    // Si no es texto, lo dejamos igual para que @IsString lo rechace.
    if (typeof value !== 'string') {
      return value;
    }

    // Normaliza el correo antes de validarlo y buscarlo en PostgreSQL.
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
  @EsCorreoInstitucional({
    message:
      'El correo debe ser institucional y terminar con @duocuc.cl',
  })
  correo: string;

  @ApiProperty({
    example: 'clave123',
    description: 'Contraseña del usuario',
  })
  @IsString({
    message: 'La contraseña debe ser un texto',
  })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria',
  })
  contrasena: string;
}
