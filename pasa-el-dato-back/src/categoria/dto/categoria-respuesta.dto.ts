import { ApiProperty } from '@nestjs/swagger';

export class CategoriaRespuestaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Tecnología y accesorios' })
  nombre: string;
}
