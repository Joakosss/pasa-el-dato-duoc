import { ApiProperty } from '@nestjs/swagger';

export class MarcaListadaDto {
  @ApiProperty({ format: 'uuid' })
  idCuenta!: string;

  @ApiProperty({ example: 'Marca Duoc' })
  nombre!: string;

  @ApiProperty({ example: 'marca@duoc.cl' })
  correo!: string;
}
