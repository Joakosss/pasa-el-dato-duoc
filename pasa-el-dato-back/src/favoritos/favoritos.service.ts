import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ListarFavoritosRespuestaDto } from './dto/listar-favoritos-respuesta.dto.js';

export type EstadoFavoritoRespuestaDto = {
  publicacionId: string;
  esFavorito: boolean;
};

@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  async listarFavoritos(
    cuentaId: string,
    page: number,
    pageSize: number,
  ): Promise<ListarFavoritosRespuestaDto> {
    const where = {
      fk_usuario: cuentaId,
      eliminado: false,
    };

    const [favoritos, total] = await Promise.all([
      this.prisma.favorito.findMany({
        where,
        orderBy: [{ fechaCreacion: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          publicacion: {
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
                  cuenta: {
                    select: {
                      eliminado: true,
                      bloqueado: true,
                      aprobada: true,
                    },
                  },
                },
              },
              imagenes: {
                select: { idImagen: true, url: true, orden: true },
                orderBy: { orden: 'asc' },
              },
            },
          },
        },
      }),
      this.prisma.favorito.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: favoritos.map(({ publicacion }) => ({
        id: publicacion.id,
        titulo: publicacion.titulo,
        descripcion: publicacion.descripcion,
        precio: publicacion.precio,
        estado: {
          id: publicacion.estadoPublicacion.id,
          descripcion: publicacion.estadoPublicacion.descripcion,
        },
        sede: { id: publicacion.sede.id, nombre: publicacion.sede.nombre },
        tipoVenta: {
          id: publicacion.tipoVenta.id,
          nombre: publicacion.tipoVenta.nombre,
        },
        categoria: {
          id: publicacion.categoria.id,
          nombre: publicacion.categoria.nombre,
        },
        imagenes: publicacion.imagenes.map((imagen) => ({
          idImagen: imagen.idImagen,
          url: imagen.url,
          orden: imagen.orden,
        })),
        disponible:
          !publicacion.eliminado &&
          publicacion.estadoPublicacion.descripcion === 'En curso' &&
          !publicacion.usuario.cuenta.eliminado &&
          !publicacion.usuario.cuenta.bloqueado &&
          publicacion.usuario.cuenta.aprobada,
      })),
      page,
      pageSize,
      total,
      nextPage: page < totalPages ? page + 1 : null,
    };
  }

  async obtenerEstadoFavorito(
    publicacionId: string,
    cuentaId: string,
  ): Promise<EstadoFavoritoRespuestaDto> {
    // Nota HU-FAV-01: para el estado solo consideramos favorito activo.
    const existe = await this.prisma.favorito.count({
      where: {
        fk_publicacion: publicacionId,
        fk_usuario: cuentaId,
        eliminado: false,
      },
    });

    return {
      publicacionId,
      esFavorito: existe > 0,
    };
  }

  async marcarFavorito(
    publicacionId: string,
    cuentaId: string,
  ): Promise<EstadoFavoritoRespuestaDto> {
    // Debe existir la publicación, no estar eliminada y el dueño no puede
    // marcarla como favorita propia.
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: publicacionId },
      select: {
        id: true,
        fk_usuario: true,
        eliminado: true,
        usuario: {
          select: {
            cuenta: {
              select: {
                bloqueado: true,
                eliminado: true,
                aprobada: true,
              },
            },
          },
        },
      },
    });

    if (publicacion === null || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Bloqueada / eliminada / no aprobada (dueño) => publicación no disponible
    if (
      publicacion.usuario.cuenta.bloqueado ||
      publicacion.usuario.cuenta.eliminado ||
      !publicacion.usuario.cuenta.aprobada
    ) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (publicacion.fk_usuario === cuentaId) {
      throw new BadRequestException('No puede guardar su propia publicación');
    }

    // Upsert lógico: si existe (aunque esté eliminado), lo reactivamos.
    await this.prisma.favorito.upsert({
      where: {
        fk_publicacion_fk_usuario: {
          fk_publicacion: publicacionId,
          fk_usuario: cuentaId,
        },
      },
      create: {
        fk_publicacion: publicacionId,
        fk_usuario: cuentaId,
        eliminado: false,
        fk_modificado_por: cuentaId,
      },
      update: {
        eliminado: false,
        fk_modificado_por: cuentaId,
        fechaModificacion: new Date(),
      },
    });

    return { publicacionId, esFavorito: true };
  }

  async quitarFavorito(
    publicacionId: string,
    cuentaId: string,
  ): Promise<EstadoFavoritoRespuestaDto> {
    // Idempotente: si no existe, responder ok igual.
    const existente = await this.prisma.favorito.findUnique({
      where: {
        fk_publicacion_fk_usuario: {
          fk_publicacion: publicacionId,
          fk_usuario: cuentaId,
        },
      },
      select: { id: true, eliminado: true },
    });

    if (existente === null) {
      return { publicacionId, esFavorito: false };
    }

    if (!existente.eliminado) {
      await this.prisma.favorito.update({
        where: { id: existente.id },
        data: {
          eliminado: true,
          fk_modificado_por: cuentaId,
          fechaModificacion: new Date(),
        },
      });
    }

    return { publicacionId, esFavorito: false };
  }
}
