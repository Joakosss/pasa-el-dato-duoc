import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import {
  MAX_CONTRASENA_MVP_LEN,
  MIN_CONTRASENA_MVP_LEN,
  validarContrasenaMvp,
} from '../../common/security/reglas-contrasena-mvp.js';

class ContrasenaMvpValidator {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return validarContrasenaMvp(value).ok;
  }

  defaultMessage(): string {
    return `La contraseña debe cumplir las reglas del MVP (largo ${MIN_CONTRASENA_MVP_LEN}-${MAX_CONTRASENA_MVP_LEN} y sin espacios al inicio/fin)`;
  }
}

export class CambiarContrasenaDto {
  @ApiProperty({ example: 'clave-actual', minLength: 1 })
  @IsString({ message: 'La contraseña actual debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  contrasenaActual!: string;

  @ApiProperty({
    example: 'clave-nueva-123',
    minLength: MIN_CONTRASENA_MVP_LEN,
    maxLength: MAX_CONTRASENA_MVP_LEN,
  })
  @IsString({ message: 'La contraseña nueva debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña nueva es obligatoria' })
  @MinLength(MIN_CONTRASENA_MVP_LEN, {
    message: `La contraseña nueva debe tener al menos ${MIN_CONTRASENA_MVP_LEN} caracteres`,
  })
  @MaxLength(MAX_CONTRASENA_MVP_LEN, {
    message: `La contraseña nueva no puede exceder ${MAX_CONTRASENA_MVP_LEN} caracteres`,
  })
  @Validate(ContrasenaMvpValidator)
  contrasenaNueva!: string;
}
