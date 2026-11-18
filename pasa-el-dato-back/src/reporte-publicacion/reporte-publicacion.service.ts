import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, TipoNotificacionUsuario } from '../generated/prisma/client.js';
import { NotificacionesService } from '../notificaciones/notificaciones.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReportePublicacionCreadoDto } from './dto/reporte-publicacion-creado.dto.js';
import {
  ESTADOS_REPORTE_EN_CURSO,
  ESTADOS_NO_REPORTEABLES,
} from './reportes-publicacion.constantes.js';

const ESTADOS_EN_RESOLUCION = ['PENDIENTE', 'EN_PROCESO'] as const;

@Injectable()
export class ReportePublicacionService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificacionesService?: NotificacionesService,
  ) {}

  // HU-REP-01 (BE02): catálogo de motivos para el selector del formulario.
  listarMotivos() {
    return this.prisma.motivoReporte.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true },
    });
  }

  // HU-REP-01 (BE04-BE06): creación autenticada de reportes de publicación.
  async crear(entrada: {
    publicacionId: string;
    motivoId: number;
    comentarios?: string;
    idReportante: string;
  }): Promise<ReportePublicacionCreadoDto> {
    // RN3: el motivo debe existir en el catálogo.
    const motivo = await this.prisma.motivoReporte.findUnique({
      where: { id: entrada.motivoId },
      select: { id: true, nombre: true },
    });

    if (!motivo) {
      throw new UnprocessableEntityException('Motivo inválido');
    }

    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: entrada.publicacionId },
      select: {
        id: true,
        eliminado: true,
        fk_usuario: true,
        estadoPublicacion: { select: { descripcion: true } },
      },
    });

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // RN4: solo 'En curso' y 'Vendido' son reportables. Se aceptan ambas
    // variantes históricas de pausada ('Pausado'/'Pausada') como no reportable.
    const descripcionEstado = publicacion.estadoPublicacion.descripcion;
    if (
      publicacion.eliminado ||
      (ESTADOS_NO_REPORTEABLES as readonly string[]).includes(descripcionEstado)
    ) {
      throw new ConflictException('La publicación no está disponible para reporte');
    }

    // RN5: no autoreporte.
    if (publicacion.fk_usuario === entrada.idReportante) {
      throw new ConflictException('No puedes reportar tu propia publicación');
    }

    // RN6: un reporte propio en curso bloquea el duplicado.
    const reporteEnCurso = await this.prisma.reportePublicacion.count({
      where: {
        fk_publicacion: entrada.publicacionId,
        fk_reportante: entrada.idReportante,
        estado: { in: [...ESTADOS_REPORTE_EN_CURSO] },
      },
    });

    if (reporteEnCurso > 0) {
      throw new ConflictException(
        'Ya tienes un reporte en curso para esta publicación',
      );
    }

    // RN7: reportes de otros reportantes coexisten; RN8: nace PENDIENTE.
    // El índice parcial uq_reporte_publicacion_en_curso cubre la carrera
    // entre dos POST simultáneos del mismo reportante (P2002).
    try {
      const reporte = await this.prisma.reportePublicacion.create({
        data: {
          motivo: motivo.nombre,
          fk_motivo: motivo.id,
          comentarios: entrada.comentarios?.trim() || null,
          fk_publicacion: entrada.publicacionId,
          fk_reportante: entrada.idReportante,
          estado: 'PENDIENTE',
        },
        select: { id: true, fechaCreacion: true },
      });

      return {
        id: reporte.id,
        publicacionId: entrada.publicacionId,
        motivoId: motivo.id,
        comentarios: entrada.comentarios?.trim() || null,
        estado: 'PENDIENTE',
        fechaCreacion: reporte.fechaCreacion,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya tienes un reporte en curso para esta publicación',
        );
      }

      throw error;
    }
  }

  async listarPendientes() {
    return this.prisma.reportePublicacion.findMany({
      where: { estado: 'PENDIENTE' },
      orderBy: { fechaCreacion: 'desc' },
      select: {
        id: true,
        motivo: true,
        comentarios: true,
        estado: true,
        fechaCreacion: true,
        publicacion: {
          select: {
            id: true,
            titulo: true,
            precio: true,
            eliminado: true,
            estadoPublicacion: { select: { id: true, descripcion: true } },
            usuario: {
              select: {
                id_cuenta: true,
                cuenta: { select: { correo: true } },
              },
            },
          },
        },
        reportante: {
          select: { id_cuenta: true, correo: true },
        },
        adminAsignado: {
          select: { id_cuenta: true, correo: true },
        },
      },
    });
  }

  async obtenerDetalle(idReporte: string) {
    const reporte = await this.prisma.reportePublicacion.findUnique({
      where: { id: idReporte },
      select: {
        id: true,
        motivo: true,
        comentarios: true,
        estado: true,
        fechaCreacion: true,
        fechaModificacion: true,
        fechaResolucion: true,
        resolucion: true,
        mensajeAdvertencia: true,
        avisoVendedorRegistrado: true,
        avisoVendedorFecha: true,
        publicacion: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            precio: true,
            eliminado: true,
            estadoPublicacion: { select: { id: true, descripcion: true } },
            tipoVenta: { select: { id: true, nombre: true } },
            categoria: { select: { id: true, nombre: true } },
            sede: { select: { id: true, nombre: true } },
            usuario: {
              select: {
                id_cuenta: true,
                cuenta: { select: { correo: true } },
                pNombre: true,
                sNombre: true,
                pApellido: true,
                sApellido: true,
              },
            },
            imagenes: {
              select: { idImagen: true, url: true, orden: true },
              orderBy: { orden: 'asc' },
            },
          },
        },
        reportante: {
          select: { id_cuenta: true, correo: true },
        },
        adminAsignado: {
          select: { id_cuenta: true, correo: true },
        },
      },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return reporte;
  }

  async tomarEnRevision(idReporte: string, adminId: string): Promise<void> {
    const actualizado = await this.prisma.reportePublicacion.updateMany({
      where: { id: idReporte, estado: 'PENDIENTE' },
      data: {
        estado: 'EN_PROCESO',
        fk_admin_asignado: adminId,
        fechaModificacion: new Date(),
      },
    });

    if (actualizado.count === 0) {
      await this.asegurarReporteDisponible(idReporte, 'El reporte no puede tomarse en revisión');
    }

    await this.prisma.auditoriaAdmin.create({
      data: {
        accion: 'TOMAR_REPORTE_PUBLICACION',
        fk_admin: adminId,
        entidad: 'ReportePublicacion',
        entidadId: idReporte,
      },
    });
  }

  async descartar(idReporte: string, adminId: string): Promise<void> {
    const reporte = await this.obtenerEstado(idReporte);

    if (!ESTADOS_EN_RESOLUCION.includes(reporte.estado as (typeof ESTADOS_EN_RESOLUCION)[number])) {
      throw new ConflictException('El reporte ya fue resuelto o descartado');
    }

    const ahora = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.reportePublicacion.update({
        where: { id: idReporte },
        data: {
          estado: 'DESCARTADO',
          resolucion: 'DESCARTE',
          fk_admin_asignado: adminId,
          fechaResolucion: ahora,
          fechaModificacion: ahora,
        },
      });

      await tx.auditoriaAdmin.create({
        data: {
          accion: 'DESCARTAR_REPORTE_PUBLICACION',
          fk_admin: adminId,
          entidad: 'ReportePublicacion',
          entidadId: idReporte,
        },
      });
    });
  }

  async reabrir(idReporte: string, adminId: string): Promise<void> {
    const reporte = await this.obtenerEstado(idReporte);

    if (reporte.estado !== 'RESUELTO' && reporte.estado !== 'DESCARTADO') {
      throw new ConflictException('Solo puede reabrirse un reporte resuelto o descartado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.reportePublicacion.update({
        where: { id: idReporte },
        data: {
          estado: 'PENDIENTE',
          fk_admin_asignado: null,
          fechaResolucion: null,
          resolucion: null,
          mensajeAdvertencia: null,
          avisoVendedorRegistrado: false,
          avisoVendedorFecha: null,
          fechaModificacion: new Date(),
        },
      });

      await tx.auditoriaAdmin.create({
        data: {
          accion: 'REABRIR_REPORTE_PUBLICACION',
          fk_admin: adminId,
          entidad: 'ReportePublicacion',
          entidadId: idReporte,
        },
      });
    });
  }

  async retirarPublicacion(
    idReporte: string,
    adminId: string,
    motivo?: string,
  ): Promise<void> {
    const reporte = await this.prisma.reportePublicacion.findUnique({
      where: { id: idReporte },
      select: {
        id: true,
        estado: true,
        fk_publicacion: true,
        publicacion: { select: { id: true, fk_usuario: true, eliminado: true } },
      },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (!ESTADOS_EN_RESOLUCION.includes(reporte.estado as (typeof ESTADOS_EN_RESOLUCION)[number])) {
      throw new ConflictException('El reporte ya fue resuelto o descartado');
    }

    const ahora = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.publicacion.update({
        where: { id: reporte.fk_publicacion },
        data: {
          eliminado: true,
          fk_modificado_por: adminId,
          fechaModificacion: ahora,
        },
      });

      await tx.reportePublicacion.update({
        where: { id: idReporte },
        data: {
          estado: 'RESUELTO',
          resolucion: 'RETIRO_PUBLICACION',
          fk_admin_asignado: adminId,
          fechaResolucion: ahora,
          fechaModificacion: ahora,
          avisoVendedorRegistrado: true,
          avisoVendedorFecha: ahora,
        },
      });

      await tx.auditoriaAdmin.create({
        data: {
          accion: 'RETIRAR_PUBLICACION',
          fk_admin: adminId,
          entidad: 'Publicacion',
          entidadId: reporte.fk_publicacion,
          detalle: motivo?.trim() || null,
        },
      });
    });

    await this.notificarResultadoReporte({
      cuentaId: reporte.publicacion.fk_usuario,
      reporteId: reporte.id,
      publicacionId: reporte.fk_publicacion,
      mensaje: 'Tu publicación fue retirada por una resolución administrativa.',
      resolucion: 'RETIRO_PUBLICACION',
    });
  }

  async resolverAdvertencia(
    idReporte: string,
    adminId: string,
    mensaje: string,
  ): Promise<void> {
    if (!mensaje.trim()) {
      throw new BadRequestException('Mensaje de advertencia requerido');
    }

    const reporte = await this.obtenerEstado(idReporte);

    if (!ESTADOS_EN_RESOLUCION.includes(reporte.estado as (typeof ESTADOS_EN_RESOLUCION)[number])) {
      throw new ConflictException('El reporte ya fue resuelto o descartado');
    }

    const ahora = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.reportePublicacion.update({
        where: { id: idReporte },
        data: {
          estado: 'RESUELTO',
          resolucion: 'ADVERTENCIA',
          mensajeAdvertencia: mensaje.trim(),
          fk_admin_asignado: adminId,
          fechaResolucion: ahora,
          fechaModificacion: ahora,
        },
      });

      await tx.auditoriaAdmin.create({
        data: {
          accion: 'ADVERTIR_VENDEDOR',
          fk_admin: adminId,
          entidad: 'ReportePublicacion',
          entidadId: idReporte,
          detalle: mensaje.trim(),
        },
      });
    });

    if (reporte.publicacion) {
      await this.notificarResultadoReporte({
        cuentaId: reporte.publicacion.fk_usuario,
        reporteId: reporte.id,
        publicacionId: reporte.fk_publicacion,
        mensaje: `Se registró una advertencia administrativa sobre tu publicación: ${mensaje.trim()}`,
        resolucion: 'ADVERTENCIA',
      });
    }
  }

  private async notificarResultadoReporte(entrada: {
    cuentaId: string;
    reporteId: string;
    publicacionId: string;
    mensaje: string;
    resolucion: 'ADVERTENCIA' | 'RETIRO_PUBLICACION';
  }): Promise<void> {
    if (!this.notificacionesService) {
      return;
    }

    await this.notificacionesService.crearNotificacion({
      cuentaId: entrada.cuentaId,
      tipo: TipoNotificacionUsuario.REPORTE_RESULTADO,
      mensaje: entrada.mensaje,
      dataJson: {
        reporteId: entrada.reporteId,
        publicacionId: entrada.publicacionId,
        resolucion: entrada.resolucion,
      },
    });
  }

  private async obtenerEstado(idReporte: string) {
    const reporte = await this.prisma.reportePublicacion.findUnique({
      where: { id: idReporte },
      select: {
        id: true,
        estado: true,
        fk_publicacion: true,
        publicacion: { select: { fk_usuario: true } },
      },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return reporte;
  }

  private async asegurarReporteDisponible(
    idReporte: string,
    mensajeConflicto: string,
  ): Promise<never> {
    const existe = await this.prisma.reportePublicacion.count({
      where: { id: idReporte },
    });

    if (existe === 0) {
      throw new NotFoundException('Reporte no encontrado');
    }

    throw new ConflictException(mensajeConflicto);
  }
}
