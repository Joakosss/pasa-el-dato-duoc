import { ApiProperty } from '@nestjs/swagger';
import { TipoNotificacionUsuario } from '../../generated/prisma/enums.js';

export class NotificacionUsuarioDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: TipoNotificacionUsuario })
  tipo!: TipoNotificacionUsuario;

  @ApiProperty()
  mensaje!: string;

  @ApiProperty()
  leida!: boolean;

  @ApiProperty({
    nullable: true,
    required: false,
    type: Object,
    additionalProperties: true,
  })
  dataJson!: Record<string, unknown> | null;

  @ApiProperty()
  fechaCreacion!: Date;
}

export class ListaNotificacionesUsuarioDto {
  @ApiProperty({ type: [NotificacionUsuarioDto] })
  items!: NotificacionUsuarioDto[];

  @ApiProperty({ nullable: true })
  nextPage!: number | null;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  total!: number;
}
