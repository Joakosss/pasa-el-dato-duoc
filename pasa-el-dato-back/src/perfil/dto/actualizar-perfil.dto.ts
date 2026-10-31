import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarPerfilDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString({ message: 'El primer nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El primer nombre no puede estar vacío' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim();
  })
  pNombre?: string;

  @ApiPropertyOptional({ example: 'Carlos', nullable: true })
  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser un texto' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const nombre = value.trim();

    return nombre === '' ? null : nombre;
  })
  sNombre?: string | null;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString({ message: 'El primer apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El primer apellido no puede estar vacío' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim();
  })
  pApellido?: string;

  @ApiPropertyOptional({ example: 'González' })
  @IsOptional()
  @IsString({ message: 'El segundo apellido debe ser un texto' })
  @IsNotEmpty({ message: 'El segundo apellido no puede estar vacío' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim();
  })
  sApellido?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @Matches(/^\d{8}$/, {
    message: 'El teléfono debe tener 8 dígitos',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const telefono = value.trim();

    if (/^\+569\d{8}$/.test(telefono)) {
      return telefono.slice(4);
    }

    if (/^9\d{8}$/.test(telefono)) {
      return telefono.slice(1);
    }

    return telefono;
  })
  telefono?: string;
}
