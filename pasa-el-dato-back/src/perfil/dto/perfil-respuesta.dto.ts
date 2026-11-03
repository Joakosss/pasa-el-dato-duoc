import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerfilSedeDto {
  @ApiProperty({ example: 'Puente Alto' })
  nombre: string;
}

export class PerfilCarreraDto {
  @ApiProperty({ example: 'Ingeniería en Informática' })
  nombre: string;
}

export class PerfilRolDto {
  @ApiProperty({ example: 'Estudiante' })
  descripcion: string;
}

// Describe la información de perfil del usuario autenticado.
export class PerfilRespuestaDto {
  @ApiProperty({ example: '12345678-9' })
  run: string;

  @ApiProperty({ example: 'Ana' })
  pNombre: string;

  @ApiPropertyOptional({ example: 'María', nullable: true })
  sNombre: string | null;

  @ApiProperty({ example: 'Soto' })
  pApellido: string;

  @ApiProperty({ example: 'Rivas' })
  sApellido: string;

  @ApiProperty({ example: 'ana.soto@duocuc.cl' })
  correo: string;

  @ApiProperty({ example: '912345678' })
  telefono: string;

  @ApiProperty({ type: PerfilSedeDto })
  sede: PerfilSedeDto;

  @ApiProperty({ type: PerfilCarreraDto })
  carrera: PerfilCarreraDto;

  @ApiProperty({ type: PerfilRolDto })
  rol: PerfilRolDto;
}
