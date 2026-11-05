import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UnirseConversacionWsDto {
  @IsString()
  conversacionId!: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class EnviarMensajeWsDto {
  @IsString()
  conversacionId!: string;

  @IsString()
  texto!: string;
}

export interface MensajeWsRespuesta {
  id: string;
  conversacionId: string;
  emisorCuentaId: string;
  texto: string;
  enviadoEn: Date;
}

export interface SincronizacionMensajesWsRespuesta {
  conversacionId: string;
  items: MensajeWsRespuesta[];
  nextCursor: string | null;
}
