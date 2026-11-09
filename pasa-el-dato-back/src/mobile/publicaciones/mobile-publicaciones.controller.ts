import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  JwtAuthGuard,
  type SesionAutenticada,
} from '../../auth/jwt-auth.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CambiarEstadoPublicacionMobileDto } from './dto/cambiar-estado-publicacion-mobile.dto.js';

type SolicitudAutenticada = Request & { user?: SesionAutenticada };

@Controller('mobile/publicaciones')
export class MobilePublicacionesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async obtenerDetalle(@Param('id') id: string) {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        eliminado: true,
        estadoPublicacion: { select: { id: true, descripcion: true } },
        sede: { select: { id: true, nombre: true } },
        tipoVenta: { select: { id: true, nombre: true } },
        categoria: { select: { id: true, nombre: true } },
        usuario: {
          select: {
            pNombre: true,
            cuenta: {
              select: { aprobada: true, bloqueado: true, eliminado: true },
            },
          },
        },
        imagenes: {
          select: { idImagen: true, url: true, orden: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (
      !publicacion ||
      publicacion.eliminado ||
      publicacion.usuario.cuenta.bloqueado ||
      publicacion.usuario.cuenta.eliminado ||
      !publicacion.usuario.cuenta.aprobada ||
      publicacion.estadoPublicacion.descripcion !== 'En curso'
    ) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return {
      id: publicacion.id,
      titulo: publicacion.titulo,
      descripcion: publicacion.descripcion,
      precio: publicacion.precio,
      estado: publicacion.estadoPublicacion,
      sede: publicacion.sede,
      tipoVenta: publicacion.tipoVenta,
      categoria: publicacion.categoria,
      vendedor: { primerNombre: publicacion.usuario.pNombre },
      imagenes: publicacion.imagenes,
    };
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard)
  async cambiarEstado(
    @Param('id') id: string,
    @Req() solicitud: SolicitudAutenticada,
    @Body() dto: CambiarEstadoPublicacionMobileDto,
  ) {
    const cuentaId = solicitud.user!.idCuenta;
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id },
      select: { id: true, fk_usuario: true, eliminado: true },
    });

    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (publicacion.fk_usuario !== cuentaId) {
      throw new ForbiddenException(
        'No tiene permisos para cambiar el estado de esta publicación',
      );
    }

    const estado = await this.prisma.estadoPublicacion.findFirst({
      where: { descripcion: dto.estado },
      select: { id: true, descripcion: true },
    });

    if (!estado) {
      throw new NotFoundException('Estado no encontrado');
    }

    await this.prisma.publicacion.update({
      where: { id: publicacion.id },
      data: { fk_estado_publicacion: estado.id },
    });

    return { id: publicacion.id, estado };
  }
}
