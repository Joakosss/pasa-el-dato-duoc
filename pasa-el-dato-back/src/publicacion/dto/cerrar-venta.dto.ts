import { Transform } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// HU-COM-01: DTO de entrada para el cierre de venta.
// compradorId es el UUID de Cuenta.id_cuenta del comprador registrado.
export class CerrarVentaDto {
  @ApiProperty({
    description: 'Identificador de la cuenta del comprador (UUID)',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsUUID('4', { message: 'El comprador indicado no es un usuario válido' })
  compradorId: string;
}
