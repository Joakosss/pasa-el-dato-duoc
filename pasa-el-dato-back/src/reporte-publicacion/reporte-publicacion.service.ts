import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const ESTADOS_EN_RESOLUCION = ['PENDIENTE', 'EN_PROCESO'] as const;

@Injectable()
export class ReportePublicacionService {
  constructor(private readonly prisma: PrismaService) {}

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
  }

  private async obtenerEstado(idReporte: string) {
    const reporte = await this.prisma.reportePublicacion.findUnique({
      where: { id: idReporte },
      select: { id: true, estado: true },
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
