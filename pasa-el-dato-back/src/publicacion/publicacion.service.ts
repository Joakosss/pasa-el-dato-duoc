import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AlmacenamientoImagenesService,
  ImagenAlmacenada,
} from './almacenamiento-imagenes.service.js';
import type { ActualizarPublicacionDto } from './dto/actualizar-publicacion.dto.js';
import type { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import type { PublicacionCreadaRespuestaDto } from './dto/publicacion-creada-respuesta.dto.js';
import type { PublicacionEdicionRespuestaDto } from './dto/publicacion-edicion-respuesta.dto.js';
import type { PublicacionListaRespuestaDto } from './dto/publicacion-lista-respuesta.dto.js';
import type { ImagenRecibida } from './validar-imagenes.js';

@Injectable()
export class PublicacionService {
  constructor(private readonly prisma: PrismaService) {}

  // T-10: crea publicacion + imagenes en una sola transaccion Prisma.
  // AlmacenamientoImagenesService ejecuta el callback dentro de su propia
  // compensacion de archivos: si la transaccion falla, los archivos escritos
  // en este request se eliminan.
  async crearPublicacion(
    dto: CrearPublicacionDto,
    archivos: ImagenRecibida[],
    idCuenta: string,
    almacenamiento: AlmacenamientoImagenesService,
  ): Promise<PublicacionCreadaRespuestaDto> {
    const { estado } = await this.asegurarCatalogosParaCrearPublicacion({
      sedeId: dto.sedeId,
      tipoVentaId: dto.tipoVentaId,
      categoriaId: dto.categoriaId,
    });

    const { resultado } = await almacenamiento.ejecutarConImagenesAlmacenadas(
      archivos,
      async (imagenesAlmacenadas: ImagenAlmacenada[]) => {
        return this.prisma.$transaction(async (tx) => {
          const publicacion = await tx.publicacion.create({
            data: {
              titulo: dto.titulo,
              descripcion: dto.descripcion,
              precio: dto.precio,
              fk_estado_publicacion: estado.id,
              fk_tipoventa: dto.tipoVentaId,
              fk_categoria: dto.categoriaId,
              fk_usuario: idCuenta,
              fk_sede: dto.sedeId,
            },
            select: {
              id: true,
              titulo: true,
              descripcion: true,
              precio: true,
              estadoPublicacion: { select: { id: true, descripcion: true } },
              sede: { select: { id: true, nombre: true } },
              tipoVenta: { select: { id: true, nombre: true } },
              categoria: { select: { id: true, nombre: true } },
            },
          });

          const imagenesCreadas = await Promise.all(
            imagenesAlmacenadas.map((img) =>
              tx.imagenPublicacion.create({
                data: {
                  fk_publicacion: publicacion.id,
                  url: img.url,
                  orden: img.orden,
                },
                select: {
                  idImagen: true,
                  url: true,
                  orden: true,
                },
              }),
            ),
          );

          const respuesta: PublicacionCreadaRespuestaDto = {
            id: publicacion.id,
            titulo: publicacion.titulo,
            descripcion: publicacion.descripcion,
            precio: publicacion.precio,
            estado: {
              id: publicacion.estadoPublicacion.id,
              descripcion: publicacion.estadoPublicacion.descripcion,
            },
            sede: {
              id: publicacion.sede.id,
              nombre: publicacion.sede.nombre,
            },
            tipoVenta: {
              id: publicacion.tipoVenta.id,
              nombre: publicacion.tipoVenta.nombre,
            },
            categoria: {
              id: publicacion.categoria.id,
              nombre: publicacion.categoria.nombre,
            },
            imagenes: imagenesCreadas.map((img) => ({
              idImagen: img.idImagen,
              url: img.url,
              orden: img.orden,
            })),
          };

          return respuesta;
        });
      },
    );

    return resultado;
  }

  async obtenerPublicacionDetalle(
    idPublicacion: string,
  ): Promise<PublicacionEdicionRespuestaDto> {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: idPublicacion },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        sede: { select: { id: true, nombre: true } },
        tipoVenta: { select: { id: true, nombre: true } },
        categoria: { select: { id: true, nombre: true } },
        eliminado: true,
        imagenes: {
          select: {
            idImagen: true,
            url: true,
            orden: true,
          },
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (publicacion === null || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return {
      id: publicacion.id,
      titulo: publicacion.titulo,
      descripcion: publicacion.descripcion,
      precio: publicacion.precio,
      sede: {
        id: publicacion.sede.id,
        nombre: publicacion.sede.nombre,
      },
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
    };
  }

  async listarPublicaciones(): Promise<PublicacionListaRespuestaDto[]> {
    const publicaciones = await this.prisma.publicacion.findMany({
      where: { eliminado: false },
      orderBy: { fechaCreacion: 'desc' },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        estadoPublicacion: { select: { id: true, descripcion: true } },
        sede: { select: { id: true, nombre: true } },
        tipoVenta: { select: { id: true, nombre: true } },
        categoria: { select: { id: true, nombre: true } },
        imagenes: {
          select: { idImagen: true, url: true, orden: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    return publicaciones.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      descripcion: p.descripcion,
      precio: p.precio,
      estado: {
        id: p.estadoPublicacion.id,
        descripcion: p.estadoPublicacion.descripcion,
      },
      sede: { id: p.sede.id, nombre: p.sede.nombre },
      tipoVenta: { id: p.tipoVenta.id, nombre: p.tipoVenta.nombre },
      categoria: { id: p.categoria.id, nombre: p.categoria.nombre },
      imagenes: p.imagenes.map((img) => ({
        idImagen: img.idImagen,
        url: img.url,
        orden: img.orden,
      })),
    }));
  }

  async obtenerPublicacionParaEdicion(
    idPublicacion: string,
    idCuenta: string,
  ): Promise<PublicacionEdicionRespuestaDto> {
    const publicacion = await this.prisma.publicacion.findFirst({
      where: {
        id: idPublicacion,
        fk_usuario: idCuenta,
        eliminado: false,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        sede: { select: { id: true, nombre: true } },
        tipoVenta: { select: { id: true, nombre: true } },
        categoria: { select: { id: true, nombre: true } },
        imagenes: {
          select: {
            idImagen: true,
            url: true,
            orden: true,
          },
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (publicacion === null) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return {
      id: publicacion.id,
      titulo: publicacion.titulo,
      descripcion: publicacion.descripcion,
      precio: publicacion.precio,
      sede: {
        id: publicacion.sede.id,
        nombre: publicacion.sede.nombre,
      },
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
    };
  }

  async actualizarPublicacion(
    idPublicacion: string,
    dto: ActualizarPublicacionDto,
    archivos: ImagenRecibida[],
    idCuenta: string,
    almacenamiento: AlmacenamientoImagenesService,
  ): Promise<PublicacionEdicionRespuestaDto> {
    const existente = await this.prisma.publicacion.findFirst({
      where: {
        id: idPublicacion,
        fk_usuario: idCuenta,
        eliminado: false,
      },
      select: {
        id: true,
        imagenes: {
          select: { url: true },
        },
      },
    });

    if (existente === null) {
      throw new NotFoundException('Publicación no encontrada');
    }

    await this.asegurarSedeDisponible(dto.sedeId);
    await this.asegurarTipoVentaExistente(dto.tipoVentaId);
    await this.asegurarCategoriaExistente(dto.categoriaId);

    // Permite guardar cambios sin re-subir imágenes:
    // si no vienen archivos, se mantienen las imágenes actuales.
    if (archivos.length === 0) {
      // Invariante esperada: toda publicación creada por el flujo actual tiene 1..5 imágenes.
      // Si por algún motivo no hay imágenes, se rechaza para preservar el contrato.
      if (existente.imagenes.length < 1 || existente.imagenes.length > 5) {
        throw new BadRequestException('Debe adjuntar entre 1 y 5 imágenes');
      }

      await this.prisma.publicacion.update({
        where: { id: existente.id },
        data: {
          titulo: dto.titulo,
          descripcion: dto.descripcion,
          precio: dto.precio,
          fk_sede: dto.sedeId,
          fk_tipoventa: dto.tipoVentaId,
          fk_categoria: dto.categoriaId,
        },
      });

      return this.obtenerPublicacionParaEdicion(existente.id, idCuenta);
    }

    const urlsPrevias = existente.imagenes.map((img) => img.url);

    const { resultado } = await almacenamiento.ejecutarConImagenesAlmacenadas(
      archivos,
      async (imagenesAlmacenadas: ImagenAlmacenada[]) => {
        return this.prisma.$transaction(async (tx) => {
          await tx.publicacion.update({
            where: { id: existente.id },
            data: {
              titulo: dto.titulo,
              descripcion: dto.descripcion,
              precio: dto.precio,
              fk_sede: dto.sedeId,
              fk_tipoventa: dto.tipoVentaId,
              fk_categoria: dto.categoriaId,
            },
          });

          await tx.imagenPublicacion.deleteMany({
            where: { fk_publicacion: existente.id },
          });

          await Promise.all(
            imagenesAlmacenadas.map((img) =>
              tx.imagenPublicacion.create({
                data: {
                  fk_publicacion: existente.id,
                  url: img.url,
                  orden: img.orden,
                },
              }),
            ),
          );

          const actualizada = await tx.publicacion.findUnique({
            where: { id: existente.id },
            select: {
              id: true,
              titulo: true,
              descripcion: true,
              precio: true,
              sede: { select: { id: true, nombre: true } },
              tipoVenta: { select: { id: true, nombre: true } },
              categoria: { select: { id: true, nombre: true } },
              imagenes: {
                select: {
                  idImagen: true,
                  url: true,
                  orden: true,
                },
                orderBy: { orden: 'asc' },
              },
            },
          });

          if (actualizada === null) {
            throw new InternalServerErrorException(
              'No fue posible actualizar la publicación',
            );
          }

          return {
            id: actualizada.id,
            titulo: actualizada.titulo,
            descripcion: actualizada.descripcion,
            precio: actualizada.precio,
            sede: {
              id: actualizada.sede.id,
              nombre: actualizada.sede.nombre,
            },
            tipoVenta: {
              id: actualizada.tipoVenta.id,
              nombre: actualizada.tipoVenta.nombre,
            },
            categoria: {
              id: actualizada.categoria.id,
              nombre: actualizada.categoria.nombre,
            },
            imagenes: actualizada.imagenes.map((imagen) => ({
              idImagen: imagen.idImagen,
              url: imagen.url,
              orden: imagen.orden,
            })),
          };
        });
      },
    );

    // Mejor esfuerzo: eliminar archivos antiguos una vez persistido todo lo nuevo.
    // Si falla, no afecta la actualización de la publicación.
    await Promise.all(
      urlsPrevias.map((url) => this.eliminarImagenPorUrl(url, almacenamiento)),
    ).catch(() => undefined);

    return resultado;
  }

  private async asegurarPublicacionPropiaNoEliminada(entrada: {
    idPublicacion: string;
    idCuenta: string;
  }): Promise<{ id: string; urlsImagenes: string[] }> {
    const existente = await this.prisma.publicacion.findUnique({
      where: { id: entrada.idPublicacion },
      select: {
        id: true,
        fk_usuario: true,
        eliminado: true,
        imagenes: {
          select: { url: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (existente === null || existente.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (existente.fk_usuario !== entrada.idCuenta) {
      throw new ForbiddenException('No tiene permisos para eliminar esta publicación');
    }

    return {
      id: existente.id,
      urlsImagenes: existente.imagenes.map((img) => img.url),
    };
  }

  async eliminarPublicacion(
    idPublicacion: string,
    idCuenta: string,
    _almacenamiento: AlmacenamientoImagenesService,
  ): Promise<void> {
    const existente = await this.asegurarPublicacionPropiaNoEliminada({
      idPublicacion,
      idCuenta,
    });

    // HU-PUB-03-BE03: eliminación lógica solamente.
    // No se borran físicamente registros (imagenes) ni archivos.
    await this.prisma.publicacion.update({
      where: { id: existente.id },
      data: { eliminado: true },
    });
  }

  private async eliminarImagenPorUrl(
    url: string,
    almacenamiento: AlmacenamientoImagenesService,
  ): Promise<void> {
    const prefijo = almacenamiento.getPrefijoUrl();
    if (!url.startsWith(prefijo)) {
      return;
    }

    const nombre = url.slice(prefijo.length + 1);
    if (!nombre) {
      return;
    }

    const { resolve, join } = await import('node:path');
    const { rm } = await import('node:fs/promises');

    const ruta = resolve(join(almacenamiento.getDirectorioUploads(), nombre));
    await rm(ruta, { force: true }).catch(() => undefined);
  }

  async asegurarSedeDisponible(sedeId: number): Promise<void> {
    const sede = await this.prisma.sede.findUnique({
      where: { id: sedeId },
      select: {
        id: true,
        activa: true,
        eliminado: true,
      },
    });

    if (sede === null) {
      throw new NotFoundException('Sede no existe');
    }

    if (!sede.activa || sede.eliminado) {
      throw new BadRequestException('Sede no disponible');
    }
  }

  async asegurarTipoVentaExistente(tipoVentaId: number): Promise<void> {
    const total = await this.prisma.tipoVenta.count({
      where: { id: tipoVentaId },
    });

    if (total === 0) {
      throw new NotFoundException('Tipo de venta no existe');
    }
  }

  async asegurarCategoriaExistente(categoriaId: number): Promise<void> {
    const total = await this.prisma.categoria.count({
      where: { id: categoriaId },
    });

    if (total === 0) {
      throw new NotFoundException('Categoría no existe');
    }
  }

  async obtenerEstadoInicialPublicacion(): Promise<{ id: number; descripcion: string }> {
    const estado = await this.prisma.estadoPublicacion.findFirst({
      where: { descripcion: 'En curso' },
      select: {
        id: true,
        descripcion: true,
      },
    });

    if (estado === null) {
      throw new InternalServerErrorException('Catálogo de estados incompleto');
    }

    return estado;
  }

  async asegurarCatalogosParaCrearPublicacion(entrada: {
    sedeId: number;
    tipoVentaId: number;
    categoriaId: number;
  }): Promise<{ estado: { id: number; descripcion: string } }> {
    await this.asegurarSedeDisponible(entrada.sedeId);
    await this.asegurarTipoVentaExistente(entrada.tipoVentaId);
    await this.asegurarCategoriaExistente(entrada.categoriaId);

    const estado = await this.obtenerEstadoInicialPublicacion();

    return { estado };
  }
}
