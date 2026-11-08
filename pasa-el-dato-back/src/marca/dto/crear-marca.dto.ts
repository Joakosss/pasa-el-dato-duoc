import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearMarcaDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  @ApiProperty({ example: 'Duoc UC' })
  nombre: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'El correo debe ser un texto' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @IsEmail({}, { message: 'El correo no es válido' })
  @ApiProperty({ example: 'contacto@marca.cl' })
  correo: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const telefono = value.trim();
    if (/^\+569\d{8}$/.test(telefono)) return telefono.slice(4);
    if (/^9\d{8}$/.test(telefono)) return telefono.slice(1);
    return telefono;
  })
  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^\d{8}$/, { message: 'El teléfono debe tener 8 dígitos' })
  @ApiProperty({ example: '12345678' })
  telefono: string;

  @IsString({ message: 'La contraseña inicial debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña inicial es obligatoria' })
  @MinLength(8, {
    message: 'La contraseña inicial debe tener al menos 8 caracteres',
  })
  @MaxLength(72, {
    message: 'La contraseña inicial no puede exceder 72 caracteres',
  })
  @ApiProperty({ example: 'clave123', minLength: 8, maxLength: 72 })
  contrasenaInicial: string;
}
