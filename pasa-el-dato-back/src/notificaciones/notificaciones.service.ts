import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  TipoNotificacionUsuario,
  type Prisma,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  EMAIL_NOTIFICACIONES_PORT,
  type EmailNotificacionEntrada,
  type EmailNotificacionesPort,
} from './email-notificaciones.port.js';
import type {
  ListaNotificacionesUsuarioDto,
  NotificacionUsuarioDto,
} from './dto/notificacion-usuario.dto.js';

type DataNotificacion = Record<string, unknown> | null;

export interface CrearNotificacionUsuarioEntrada {
  cuentaId: string;
  tipo: TipoNotificacionUsuario;
  mensaje: string;
  dataJson?: DataNotificacion;
}

@Injectable()
export class NotificacionesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(EMAIL_NOTIFICACIONES_PORT)
    private readonly emailNotificaciones?: EmailNotificacionesPort,
  ) {}

  async crearNotificacion(
    entrada: CrearNotificacionUsuarioEntrada,
  ): Promise<NotificacionUsuarioDto | null> {
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: entrada.cuentaId },
      select: {
        id_cuenta: true,
        correo: true,
        aprobada: true,
        bloqueado: true,
        eliminado: true,
      },
    });

    if (
      !cuenta ||
      !cuenta.aprobada ||
      cuenta.bloqueado ||
      cuenta.eliminado
    ) {
      return null;
    }

    const notificacion = await this.prisma.notificacionUsuario.create({
      data: {
        fk_cuenta: entrada.cuentaId,
        tipo: entrada.tipo,
        mensaje: entrada.mensaje,
        dataJson: entrada.dataJson as Prisma.InputJsonValue | undefined,
      },
    });

    if (
      this.emailNotificaciones &&
      cuenta.correo &&
      this.eventoIncluyeCorreo(entrada.tipo)
    ) {
      const correo: EmailNotificacionEntrada = {
        destinatario: cuenta.correo,
        tipo: entrada.tipo,
        mensaje: entrada.mensaje,
        dataJson: entrada.dataJson ?? null,
      };

      await this.emailNotificaciones.enviar(correo);
    }

    return this.mapearNotificacion(notificacion);
  }

  async listar(
    cuentaId: string,
    pagina = 1,
    tamano = 20,
  ): Promise<ListaNotificacionesUsuarioDto> {
    const page = Math.max(1, Math.trunc(pagina));
    const pageSize = Math.min(50, Math.max(1, Math.trunc(tamano)));
    const where = { fk_cuenta: cuentaId };

    const [items, total] = await Promise.all([
      this.prisma.notificacionUsuario.findMany({
        where,
        orderBy: [{ fechaCreacion: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notificacionUsuario.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: items.map((item) => this.mapearNotificacion(item)),
      page,
      pageSize,
      total,
      nextPage: page < totalPages ? page + 1 : null,
    };
  }

  async marcarComoLeida(
    cuentaId: string,
    notificacionId: string,
  ): Promise<NotificacionUsuarioDto> {
    const notificacion = await this.prisma.notificacionUsuario.findUnique({
      where: { id: notificacionId },
    });

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (notificacion.fk_cuenta !== cuentaId) {
      throw new ForbiddenException('No tiene acceso a esta notificación');
    }

    const actualizada = notificacion.leida
      ? notificacion
      : await this.prisma.notificacionUsuario.update({
          where: { id: notificacionId },
          data: { leida: true },
        });

    return this.mapearNotificacion(actualizada);
  }

  async obtenerPreferencias(cuentaId: string): Promise<{ pushHabilitado: boolean }> {
    const cuenta = await this.obtenerCuentaActiva(cuentaId);

    return { pushHabilitado: cuenta.notificacionesPushHabilitadas };
  }

  async actualizarPreferencias(
    cuentaId: string,
    pushHabilitado: boolean,
  ): Promise<{ pushHabilitado: boolean }> {
    await this.obtenerCuentaActiva(cuentaId);

    const cuenta = await this.prisma.cuenta.update({
      where: { id_cuenta: cuentaId },
      data: { notificacionesPushHabilitadas: pushHabilitado },
      select: { notificacionesPushHabilitadas: true },
    });

    return { pushHabilitado: cuenta.notificacionesPushHabilitadas };
  }

  private eventoIncluyeCorreo(tipo: TipoNotificacionUsuario): boolean {
    return tipo === TipoNotificacionUsuario.REPORTE_RESULTADO;
  }

  private async obtenerCuentaActiva(cuentaId: string) {
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: cuentaId },
      select: {
        id_cuenta: true,
        aprobada: true,
        bloqueado: true,
        eliminado: true,
        notificacionesPushHabilitadas: true,
      },
    });

    if (
      !cuenta ||
      !cuenta.aprobada ||
      cuenta.bloqueado ||
      cuenta.eliminado
    ) {
      throw new ForbiddenException('Cuenta inactiva');
    }

    return cuenta;
  }

  private mapearNotificacion(notificacion: {
    id: string;
    tipo: TipoNotificacionUsuario;
    mensaje: string;
    leida: boolean;
    dataJson: Prisma.JsonValue | null;
    fechaCreacion: Date;
  }): NotificacionUsuarioDto {
    return {
      id: notificacion.id,
      tipo: notificacion.tipo,
      mensaje: notificacion.mensaje,
      leida: notificacion.leida,
      dataJson:
        notificacion.dataJson &&
        typeof notificacion.dataJson === 'object' &&
        !Array.isArray(notificacion.dataJson)
          ? (notificacion.dataJson as Record<string, unknown>)
          : null,
      fechaCreacion: notificacion.fechaCreacion,
    };
  }
}
