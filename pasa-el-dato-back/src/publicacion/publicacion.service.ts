import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AlmacenamientoImagenesService, ImagenAlmacenada } from './almacenamiento-imagenes.service.js';
import type { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import type { PublicacionCreadaRespuestaDto } from './dto/publicacion-creada-respuesta.dto.js';
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
