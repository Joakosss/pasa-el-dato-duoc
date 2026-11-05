import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListarMensajesQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor de paginación. Corresponde al _id (ObjectId como string) del último elemento recibido en la página anterior.',
    example: '6727f2a3e6d8c3b1a1b2c3d4',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description:
      'Cantidad de mensajes a devolver. Web usa 20; mobile usa 10. Se acota por seguridad.',
    example: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
