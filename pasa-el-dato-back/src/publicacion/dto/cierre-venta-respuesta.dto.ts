import { ApiProperty } from '@nestjs/swagger';

class EstadoPublicacionDto {
  @ApiProperty({ example: 3 })
  id: number;

  @ApiProperty({ example: 'Vendido' })
  descripcion: string;
}

class ParticipanteTransaccionDto {
  @ApiProperty({ example: '7c9e6679-7425-40de-944b-e07fc1f90ae7' })
  id: string;

  @ApiProperty({ example: 'Ana Pérez' })
  nombre: string;
}

// HU-COM-01: respuesta del cierre de venta y de la consulta de transacción.
// Expone las tres partes identificables: publicación, vendedor y comprador.
export class CierreVentaRespuestaDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id: string;

  @ApiProperty({ example: true })
  calificacionActivada: boolean;

  @ApiProperty({ type: EstadoPublicacionDto })
  estado: EstadoPublicacionDto;

  @ApiProperty({ type: ParticipanteTransaccionDto })
  vendedor: ParticipanteTransaccionDto;

  @ApiProperty({ type: ParticipanteTransaccionDto })
  comprador: ParticipanteTransaccionDto;
}
