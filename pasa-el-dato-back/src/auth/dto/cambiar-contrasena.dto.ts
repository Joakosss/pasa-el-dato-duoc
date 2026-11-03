import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarContrasenaDto {
  @ApiProperty({ example: 'clave-actual', minLength: 1 })
  @IsString({ message: 'La contraseña actual debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  contrasenaActual!: string;

  @ApiProperty({ example: 'clave-nueva-123', minLength: 8 })
  @IsString({ message: 'La contraseña nueva debe ser un texto' })
  @IsNotEmpty({ message: 'La contraseña nueva es obligatoria' })
  @MinLength(8, {
    message: 'La contraseña nueva debe tener al menos 8 caracteres',
  })
  contrasenaNueva!: string;
}
