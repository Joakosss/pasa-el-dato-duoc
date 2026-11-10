import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ActualizarPreferenciasNotificacionesDto {
  @ApiProperty({
    description: 'Indica si la entrega in-app está habilitada para eventos futuros.',
    example: true,
  })
  @IsBoolean()
  pushHabilitado!: boolean;
}

export class PreferenciasNotificacionesRespuestaDto {
  @ApiProperty({ example: true })
  pushHabilitado!: boolean;
}
