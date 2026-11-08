import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
type EstadoReporteUsuario =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'RESUELTO'
  | 'DESCARTADO';

type ResolucionReporteUsuario = 'BLOQUEO' | 'ADVERTENCIA' | 'DESCARTE';
import { PrismaService } from '../prisma/prisma.service.js';

type ReporteUsuarioLista = {
  id: string;
  descripcion: string;
  estado: EstadoReporteUsuario;
  fechaCreacion: Date;
  reportado: {
    id: string;
    correo: string;
    bloqueado: boolean;
    usuario: {
      pNombre: string;
      sNombre: string | null;
      pApellido: string;
      sApellido: string;
      rol_usuario: { descripcion: string };
    } | null;
  };
  adminAsignado: {
    id: string;
    correo: string;
  } | null;
};

type ReporteUsuarioDetalle = {
  id: string;
  descripcion: string;
  estado: EstadoReporteUsuario;
  fechaCreacion: Date;
  fechaResolucion: Date | null;
  resolucion: ResolucionReporteUsuario | null;
  mensajeAdvertencia: string | null;
  motivoBloqueo: string | null;
  reportado: {
    id: string;
    correo: string;
    bloqueado: boolean;
    eliminado: boolean;
    aprobada: boolean;
    fechaBloqueo: Date | null;
    motivoBloqueo: string | null;
    usuario: {
      pNombre: string;
      sNombre: string | null;
      pApellido: string;
      sApellido: string;
      rol_usuario: { descripcion: string };
      sede: { id: number; nombre: string };
      carrera: { id: number; nombre: string };
    } | null;
  };
  adminAsignado: {
    id: string;
    correo: string;
  } | null;
};

@Injectable()
export class ReporteUsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPendientes(): Promise<ReporteUsuarioLista[]> {
    const reportes = await this.prisma.reporteUsuario.findMany({
      where: { estado: 'PENDIENTE' },
      orderBy: { fechaCreacion: 'desc' },
      select: {
        id: true,
        descripcion: true,
        estado: true,
        fechaCreacion: true,
        reportado: {
          select: {
            id_cuenta: true,
            correo: true,
            bloqueado: true,
            usuario: {
              select: {
                pNombre: true,
                sNombre: true,
                pApellido: true,
                sApellido: true,
                rol_usuario: { select: { descripcion: true } },
              },
            },
          },
        },
        adminAsignado: {
          select: {
            id_cuenta: true,
            correo: true,
          },
        },
      },
    });

    return reportes.map((r: (typeof reportes)[number]) => ({
      id: r.id,
      descripcion: r.descripcion,
      estado: r.estado,
      fechaCreacion: r.fechaCreacion,
      reportado: {
        id: r.reportado.id_cuenta,
        correo: r.reportado.correo,
        bloqueado: r.reportado.bloqueado,
        usuario: r.reportado.usuario
          ? {
              pNombre: r.reportado.usuario.pNombre,
              sNombre: r.reportado.usuario.sNombre,
              pApellido: r.reportado.usuario.pApellido,
              sApellido: r.reportado.usuario.sApellido,
              rol_usuario: { descripcion: r.reportado.usuario.rol_usuario.descripcion },
            }
          : null,
      },
      adminAsignado: r.adminAsignado
        ? { id: r.adminAsignado.id_cuenta, correo: r.adminAsignado.correo }
        : null,
    }));
  }

  async obtenerDetalle(idReporte: string): Promise<ReporteUsuarioDetalle> {
    const reporte = await this.prisma.reporteUsuario.findUnique({
      where: { id: idReporte },
      select: {
        id: true,
        descripcion: true,
        estado: true,
        fechaCreacion: true,
        fechaResolucion: true,
        resolucion: true,
        mensajeAdvertencia: true,
        motivoBloqueo: true,
        reportado: {
          select: {
            id_cuenta: true,
            correo: true,
            bloqueado: true,
            eliminado: true,
            aprobada: true,
            fechaBloqueo: true,
            motivoBloqueo: true,
            usuario: {
              select: {
                pNombre: true,
                sNombre: true,
                pApellido: true,
                sApellido: true,
                rol_usuario: { select: { descripcion: true } },
                sede: { select: { id: true, nombre: true } },
                carrera: { select: { id: true, nombre: true } },
              },
            },
          },
        },
        adminAsignado: {
          select: {
            id_cuenta: true,
            correo: true,
          },
        },
      },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return {
      id: reporte.id,
      descripcion: reporte.descripcion,
      estado: reporte.estado,
      fechaCreacion: reporte.fechaCreacion,
      fechaResolucion: reporte.fechaResolucion,
      resolucion: reporte.resolucion,
      mensajeAdvertencia: reporte.mensajeAdvertencia,
      motivoBloqueo: reporte.motivoBloqueo,
      reportado: {
        id: reporte.reportado.id_cuenta,
        correo: reporte.reportado.correo,
        bloqueado: reporte.reportado.bloqueado,
        eliminado: reporte.reportado.eliminado,
        aprobada: reporte.reportado.aprobada,
        fechaBloqueo: reporte.reportado.fechaBloqueo,
        motivoBloqueo: reporte.reportado.motivoBloqueo,
        usuario: reporte.reportado.usuario
          ? {
              pNombre: reporte.reportado.usuario.pNombre,
              sNombre: reporte.reportado.usuario.sNombre,
              pApellido: reporte.reportado.usuario.pApellido,
              sApellido: reporte.reportado.usuario.sApellido,
              rol_usuario: {
                descripcion: reporte.reportado.usuario.rol_usuario.descripcion,
              },
              sede: {
                id: reporte.reportado.usuario.sede.id,
                nombre: reporte.reportado.usuario.sede.nombre,
              },
              carrera: {
                id: reporte.reportado.usuario.carrera.id,
                nombre: reporte.reportado.usuario.carrera.nombre,
              },
            }
          : null,
      },
      adminAsignado: reporte.adminAsignado
        ? { id: reporte.adminAsignado.id_cuenta, correo: reporte.adminAsignado.correo }
        : null,
    };
  }

  async tomarEnRevision(idReporte: string, adminId: string): Promise<void> {
    const actualizado = await this.prisma.reporteUsuario.updateMany({
      where: { id: idReporte, estado: 'PENDIENTE' },
      data: {
        estado: 'EN_PROCESO',
        fk_admin_asignado: adminId,
        fechaModificacion: new Date(),
      },
    });

    if (actualizado.count === 0) {
      const existe = await this.prisma.reporteUsuario.count({
        where: { id: idReporte },
      });
      if (existe === 0) {
        throw new NotFoundException('Reporte no encontrado');
      }
      throw new ConflictException('El reporte no puede tomarse en revisión');
    }
  }

  async descartar(idReporte: string, adminId: string): Promise<void> {
    const reporte = await this.prisma.reporteUsuario.findUnique({
      where: { id: idReporte },
      select: { id: true, estado: true },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (reporte.estado === 'RESUELTO' || reporte.estado === 'DESCARTADO') {
      throw new ConflictException('El reporte ya fue resuelto');
    }

    await this.prisma.reporteUsuario.update({
      where: { id: reporte.id },
      data: {
        estado: 'DESCARTADO',
        resolucion: 'DESCARTE',
        fk_admin_asignado: adminId,
        fechaResolucion: new Date(),
        fechaModificacion: new Date(),
      },
    });
  }

  async reabrir(idReporte: string): Promise<void> {
    const reporte = await this.prisma.reporteUsuario.findUnique({
      where: { id: idReporte },
      select: { id: true, estado: true },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (reporte.estado !== 'RESUELTO' && reporte.estado !== 'DESCARTADO') {
      throw new ConflictException('Solo puede reabrirse un reporte resuelto o descartado');
    }

    await this.prisma.reporteUsuario.update({
      where: { id: reporte.id },
      data: {
        estado: 'PENDIENTE',
        fk_admin_asignado: null,
        fechaResolucion: null,
        resolucion: null,
        mensajeAdvertencia: null,
        motivoBloqueo: null,
        fechaModificacion: new Date(),
      },
    });
  }

  async resolverAdvertencia(entrada: {
    idReporte: string;
    adminId: string;
    mensaje: string;
  }): Promise<void> {
    if (!entrada.mensaje.trim()) {
      throw new BadRequestException('Mensaje de advertencia requerido');
    }

    const reporte = await this.prisma.reporteUsuario.findUnique({
      where: { id: entrada.idReporte },
      select: { id: true, estado: true, fk_reportado: true },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (reporte.estado === 'RESUELTO' || reporte.estado === 'DESCARTADO') {
      throw new ConflictException('El reporte ya fue resuelto');
    }

    await this.prisma.reporteUsuario.update({
      where: { id: reporte.id },
      data: {
        estado: 'RESUELTO',
        resolucion: 'ADVERTENCIA',
        mensajeAdvertencia: entrada.mensaje,
        fk_admin_asignado: entrada.adminId,
        fechaResolucion: new Date(),
        fechaModificacion: new Date(),
      },
    });
  }

  async resolverBloqueo(entrada: {
    idReporte: string;
    adminId: string;
    motivo: string;
  }): Promise<void> {
    if (!entrada.motivo.trim()) {
      throw new BadRequestException('Motivo de bloqueo requerido');
    }

    const reporte = await this.prisma.reporteUsuario.findUnique({
      where: { id: entrada.idReporte },
      select: { id: true, estado: true, fk_reportado: true },
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (reporte.estado === 'RESUELTO' || reporte.estado === 'DESCARTADO') {
      throw new ConflictException('El reporte ya fue resuelto');
    }

    await this.prisma.$transaction(async (tx) => {
      const cuenta = await tx.cuenta.findUnique({
        where: { id_cuenta: reporte.fk_reportado },
        select: { id_cuenta: true, bloqueado: true },
      });

      if (!cuenta) {
        throw new NotFoundException('Usuario reportado no encontrado');
      }

      if (cuenta.bloqueado) {
        throw new ConflictException('La cuenta ya está bloqueada');
      }

      await tx.cuenta.update({
        where: { id_cuenta: cuenta.id_cuenta },
        data: {
          bloqueado: true,
          fechaBloqueo: new Date(),
          motivoBloqueo: entrada.motivo,
          fechaModificacion: new Date(),
          fk_modificado_por: entrada.adminId,
        },
      });

      await tx.reporteUsuario.update({
        where: { id: reporte.id },
        data: {
          estado: 'RESUELTO',
          resolucion: 'BLOQUEO',
          motivoBloqueo: entrada.motivo,
          fk_admin_asignado: entrada.adminId,
          fechaResolucion: new Date(),
          fechaModificacion: new Date(),
        },
      });
    });
  }

  // Validación central: solo administrador puede usar el módulo (RolesGuard ya lo filtra),
  // pero dejamos helper por si se usa desde otro lugar.
  async asegurarAdmin(idCuenta: string): Promise<void> {
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: idCuenta },
      select: { usuario: { select: { rol_usuario: { select: { descripcion: true } } } } },
    });

    if (!cuenta?.usuario) {
      throw new ForbiddenException('La sesión no corresponde a un administrador.');
    }

    if (cuenta.usuario.rol_usuario.descripcion !== 'Administrador') {
      throw new ForbiddenException('La sesión no corresponde a un administrador.');
    }
  }
}
