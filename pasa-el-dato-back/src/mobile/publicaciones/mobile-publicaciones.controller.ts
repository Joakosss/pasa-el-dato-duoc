import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
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
import { ListarPublicacionesCercanasMobileDto } from './dto/listar-publicaciones-cercanas-mobile.dto.js';

type SolicitudAutenticada = Request & { user?: SesionAutenticada };

const RADIO_TERRESTRE_KM = 6371;

function calcularDistanciaKm(
  latitudOrigen: number,
  longitudOrigen: number,
  latitudDestino: number,
  longitudDestino: number,
): number {
  const gradosARadianes = (grados: number) => (grados * Math.PI) / 180;
  const diferenciaLatitud = gradosARadianes(latitudDestino - latitudOrigen);
  const diferenciaLongitud = gradosARadianes(longitudDestino - longitudOrigen);
  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(gradosARadianes(latitudOrigen)) *
      Math.cos(gradosARadianes(latitudDestino)) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  return RADIO_TERRESTRE_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Controller('mobile/publicaciones')
export class MobilePublicacionesController {
  constructor(private readonly prisma: PrismaService) {}

  // La ubicación del dispositivo se usa solo para esta consulta; no se persiste.
  @Get('cercanas')
  async listarCercanas(
    @Query() consulta: ListarPublicacionesCercanasMobileDto,
  ) {
    const radioKm = consulta.radioKm ?? 50;
    const publicaciones = await this.prisma.publicacion.findMany({
      where: {
        eliminado: false,
        estadoPublicacion: { descripcion: 'En curso' },
        sede: { latitud: { not: null }, longitud: { not: null } },
        usuario: {
          cuenta: {
            eliminado: false,
            bloqueado: false,
            aprobada: true,
          },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        estadoPublicacion: { select: { id: true, descripcion: true } },
        sede: { select: { id: true, nombre: true, latitud: true, longitud: true } },
        tipoVenta: { select: { id: true, nombre: true } },
        categoria: { select: { id: true, nombre: true } },
        imagenes: {
          select: { idImagen: true, url: true, orden: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    return publicaciones
      .flatMap((publicacion) => {
        if (publicacion.sede.latitud === null || publicacion.sede.longitud === null) {
          return [];
        }

        const distanciaKm = calcularDistanciaKm(
          consulta.latitud,
          consulta.longitud,
          publicacion.sede.latitud,
          publicacion.sede.longitud,
        );

        if (distanciaKm > radioKm) return [];

        return [{
          id: publicacion.id,
          titulo: publicacion.titulo,
          descripcion: publicacion.descripcion,
          precio: publicacion.precio,
          estado: publicacion.estadoPublicacion,
          sede: { id: publicacion.sede.id, nombre: publicacion.sede.nombre },
          tipoVenta: publicacion.tipoVenta,
          categoria: publicacion.categoria,
          imagenes: publicacion.imagenes,
          distanciaKm: Math.round(distanciaKm * 10) / 10,
        }];
      })
      .sort((primera, segunda) => primera.distanciaKm - segunda.distanciaKm);
  }

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
