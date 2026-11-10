import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { TipoNotificacionUsuario } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificacionesService } from '../notificaciones/notificaciones.service.js';
import type {
  AlmacenamientoImagenesService,
  ImagenAlmacenada,
} from './almacenamiento-imagenes.service.js';
import type { ActualizarPublicacionDto } from './dto/actualizar-publicacion.dto.js';
import type { CierreVentaRespuestaDto } from './dto/cierre-venta-respuesta.dto.js';
import type { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import type { PublicacionCreadaRespuestaDto } from './dto/publicacion-creada-respuesta.dto.js';
import type { PublicacionEdicionRespuestaDto } from './dto/publicacion-edicion-respuesta.dto.js';
import type { PublicacionListaRespuestaDto } from './dto/publicacion-lista-respuesta.dto.js';
import type { ImagenRecibida } from './validar-imagenes.js';
import { ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO } from './publicacion-estados.constantes.js';

@Injectable()
export class PublicacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

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
        estadoPublicacion: { select: { descripcion: true } },
        usuario: {
          select: {
            cuenta: {
              select: {
                aprobada: true,
                bloqueado: true,
                eliminado: true,
              },
            },
          },
        },
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

    // Regla MVP: si la cuenta del propietario está inactiva/bloqueada/eliminada,
    // la publicación se oculta como 404 (sin filtrar información).
    if (
      publicacion.usuario.cuenta.bloqueado ||
      publicacion.usuario.cuenta.eliminado ||
      !publicacion.usuario.cuenta.aprobada
    ) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Regla MVP de visibilidad:
    // Público (detalle) solo ve "En curso". Pausada/Vendida se ocultan como 404.
    if (publicacion.estadoPublicacion.descripcion !== 'En curso') {
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
      where: {
        eliminado: false,
        estadoPublicacion: { descripcion: 'En curso' },
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
        sede: { select: { id: true, nombre: true } },
        tipoVenta: { select: { id: true, nombre: true } },
        categoria: { select: { id: true, nombre: true } },
        imagenes: {
          select: { idImagen: true, url: true, orden: true },
          orderBy: { orden: 'asc' },
        },
      },
    });

    return this.toListaRespuesta(publicaciones);
  }

  async listarPublicacionesDeCuenta(
    idCuenta: string,
  ): Promise<PublicacionListaRespuestaDto[]> {
    const publicaciones = await this.prisma.publicacion.findMany({
      where: { eliminado: false, fk_usuario: idCuenta },
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

    return this.toListaRespuesta(publicaciones);
  }

  private toListaRespuesta(
    publicaciones: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      precio: number;
      estadoPublicacion: { id: number; descripcion: string };
      sede: { id: number; nombre: string };
      tipoVenta: { id: number; nombre: string };
      categoria: { id: number; nombre: string };
      imagenes: Array<{ idImagen: string; url: string; orden: number }>;
    }>,
  ): PublicacionListaRespuestaDto[] {
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

  async cambiarEstadoPublicacion(entrada: {
    idPublicacion: string;
    idCuenta: string;
    estadoDescripcion: string;
  }): Promise<{ id: string; estado: { id: number; descripcion: string } }> {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: entrada.idPublicacion },
      select: {
        id: true,
        fk_usuario: true,
        eliminado: true,
      },
    });

    if (publicacion === null || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (publicacion.fk_usuario !== entrada.idCuenta) {
      throw new ForbiddenException(
        'No tiene permisos para cambiar el estado de esta publicación',
      );
    }

    if (
      !ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO.includes(
        entrada.estadoDescripcion as (typeof ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO)[number],
      )
    ) {
      throw new BadRequestException('Estado inválido o no asignable por propietario');
    }

    const estado = await this.prisma.estadoPublicacion.findFirst({
      where: { descripcion: entrada.estadoDescripcion },
      select: { id: true, descripcion: true },
    });

    if (estado === null) {
      throw new BadRequestException('Estado inválido o no asignable por propietario');
    }

    await this.prisma.publicacion.update({
      where: { id: publicacion.id },
      data: { fk_estado_publicacion: estado.id },
    });

    return { id: publicacion.id, estado };
  }

  // HU-COM-01: construye el nombre completo de un usuario a partir de los
  // campos del modelo Usuario (p_nombre, s_nombre, p_apellido, s_apellido).
  private construirNombreCompleto(usuario: {
    pNombre: string;
    sNombre: string | null;
    pApellido: string;
    sApellido: string;
  }): string {
    return [usuario.pNombre, usuario.sNombre, usuario.pApellido, usuario.sApellido]
      .filter((parte): parte is string => Boolean(parte && parte.trim()))
      .join(' ');
  }

  // HU-COM-01-BE02/BE03/BE04/BE05: cierre de venta atómico con registro de
  // comprador. Única vía válida para que una publicación quede "Vendido".
  async cerrarVenta(entrada: {
    idPublicacion: string;
    vendedorId: string;
    compradorId: string;
  }): Promise<CierreVentaRespuestaDto> {
    // Pre-chequeo fuera de la transacción: existencia, ownership, no eliminada.
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: entrada.idPublicacion },
      select: {
        id: true,
        fk_usuario: true,
        fk_user_comprador: true,
        eliminado: true,
        estadoPublicacion: { select: { descripcion: true } },
      },
    });

    if (publicacion === null || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    if (publicacion.fk_usuario !== entrada.vendedorId) {
      throw new ForbiddenException(
        'No tiene permisos para cerrar la venta de esta publicación',
      );
    }

    // HU-COM-01-BE04: el comprador no puede ser el propio vendedor.
    if (entrada.compradorId === entrada.vendedorId) {
      throw new BadRequestException(
        'No puede ser comprador de su propia publicación',
      );
    }

    // HU-COM-01-BE05: idempotencia. Si ya está cerrada, se devuelve el
    // registro existente sin alterar el comprador registrado.
    if (
      publicacion.estadoPublicacion.descripcion === 'Vendido' &&
      publicacion.fk_user_comprador !== null
    ) {
      return this.construirRespuestaTransaccion(publicacion.id);
    }

    // HU-COM-01-BE04: el comprador debe ser una cuenta de usuario válida
    // (no eliminada, no bloqueada, aprobada) y no puede ser una marca.
    const cuentaComprador = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: entrada.compradorId },
      select: {
        aprobada: true,
        bloqueado: true,
        eliminado: true,
        usuario: { select: { id_cuenta: true } },
      },
    });

    if (
      cuentaComprador === null ||
      cuentaComprador.usuario === null ||
      cuentaComprador.eliminado ||
      cuentaComprador.bloqueado ||
      !cuentaComprador.aprobada
    ) {
      throw new BadRequestException('El comprador indicado no es un usuario válido');
    }

    const estadoVendida = await this.prisma.estadoPublicacion.findFirst({
      where: { descripcion: 'Vendido' },
      select: { id: true },
    });

    if (estadoVendida === null) {
      throw new InternalServerErrorException('Catálogo de estados incompleto');
    }

    // Reparación idempotente: versiones anteriores del flujo mobile podían
    // cambiar el estado luego de registrar el comprador. La transacción ya
    // cerrada conserva su comprador y se restituye el estado canónico.
    if (publicacion.fk_user_comprador !== null) {
      if (publicacion.estadoPublicacion.descripcion !== 'Vendido') {
        await this.prisma.publicacion.update({
          where: { id: publicacion.id },
          data: {
            fk_estado_publicacion: estadoVendida.id,
            fechaModificacion: new Date(),
          },
        });
      }

      return this.construirRespuestaTransaccion(publicacion.id);
    }

    // HU-COM-01-BE05: updateMany con condición fk_user_comprador: null actúa
    // como barrera atómica a nivel de fila en PostgreSQL contra cierres
    // concurrentes. Si otra petición ya cerró la venta, count será 0.
    const resultadoUpdate = await this.prisma.publicacion.updateMany({
      where: {
        id: entrada.idPublicacion,
        fk_usuario: entrada.vendedorId,
        fk_user_comprador: null,
        eliminado: false,
      },
      data: {
        fk_user_comprador: entrada.compradorId,
        fk_estado_publicacion: estadoVendida.id,
        fechaModificacion: new Date(),
      },
    });

    if (resultadoUpdate.count === 0) {
      // Ya fue cerrada por otra petición concurrente: idempotencia.
      return this.construirRespuestaTransaccion(entrada.idPublicacion);
    }

    await this.notificarFavoritaVendida({
      idPublicacion: entrada.idPublicacion,
      vendedorId: entrada.vendedorId,
    });

    return this.construirRespuestaTransaccion(entrada.idPublicacion);
  }

  // HU-COM-01-BE06: consulta de la transacción (publicación + vendedor +
  // comprador) accesible solo para los participantes.
  async obtenerTransaccion(entrada: {
    idPublicacion: string;
    idCuenta: string;
  }): Promise<CierreVentaRespuestaDto> {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: entrada.idPublicacion },
      select: {
        id: true,
        fk_usuario: true,
        fk_user_comprador: true,
        eliminado: true,
        estadoPublicacion: { select: { descripcion: true } },
      },
    });

    if (
      publicacion === null ||
      publicacion.eliminado ||
      publicacion.estadoPublicacion.descripcion !== 'Vendido' ||
      publicacion.fk_user_comprador === null
    ) {
      throw new NotFoundException('Publicación no encontrada');
    }

    const esVendedor = publicacion.fk_usuario === entrada.idCuenta;
    const esComprador = publicacion.fk_user_comprador === entrada.idCuenta;

    if (!esVendedor && !esComprador) {
      throw new ForbiddenException('No tiene acceso a esta transacción');
    }

    return this.construirRespuestaTransaccion(publicacion.id);
  }

  private async notificarFavoritaVendida(entrada: {
    idPublicacion: string;
    vendedorId: string;
  }): Promise<void> {
    const favoritos: Array<{ fk_usuario: string }> =
      await this.prisma.favorito.findMany({
        where: {
          fk_publicacion: entrada.idPublicacion,
          eliminado: false,
          usuario: {
            cuenta: {
              eliminado: false,
              bloqueado: false,
              aprobada: true,
            },
          },
        },
        select: { fk_usuario: true },
      });

    if (favoritos.length === 0) {
      return;
    }

    await Promise.all(
      favoritos.map((fav: { fk_usuario: string }) =>
        this.notificacionesService.crearNotificacion({
          cuentaId: fav.fk_usuario,
          tipo: 'FAVORITA_VENDIDA' as TipoNotificacionUsuario,
          mensaje: 'Una publicación que marcaste como favorita fue vendida',
          dataJson: { publicacionId: entrada.idPublicacion },
        }),
      ),
    );
  }

  async activarCalificacion(entrada: {
    idPublicacion: string;
    idCuenta: string;
  }): Promise<{
    publicacionId: string;
    calificacionActivada: boolean;
    fechaActivacionCalificacion: string | null;
  }> {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: entrada.idPublicacion },
      select: {
        id: true,
        eliminado: true,
        fk_usuario: true,
        fk_user_comprador: true,
        calificacion_activada: true,
        fecha_activacion_calificacion: true,
        estadoPublicacion: { select: { descripcion: true } },
      },
    });

    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Ownership: solo vendedor (owner) puede activar
    if (publicacion.fk_usuario !== entrada.idCuenta) {
      throw new ForbiddenException('No tiene permisos para activar la calificación');
    }

    // Precondición: transacción finalizada = Vendido + comprador registrado
    if (publicacion.estadoPublicacion.descripcion !== 'Vendido') {
      // Mantener compatibilidad con mensajes existentes de CAL-01
      throw new NotFoundException('No hay transacción finalizada para activar calificación');
    }
    if (!publicacion.fk_user_comprador) {
      throw new UnprocessableEntityException('La venta no tiene comprador registrado');
    }

    // Idempotencia: si ya está activada, devolver estado actual
    if (publicacion.calificacion_activada) {
      return {
        publicacionId: publicacion.id,
        calificacionActivada: true,
        fechaActivacionCalificacion: publicacion.fecha_activacion_calificacion
          ? new Date(publicacion.fecha_activacion_calificacion).toISOString()
          : null,
      };
    }

    const ahora = new Date();

    // Update atómico (barrera) para soportar concurrencia
    const resultado = await this.prisma.publicacion.updateMany({
      where: {
        id: publicacion.id,
        eliminado: false,
        fk_usuario: entrada.idCuenta,
        calificacion_activada: false,
      },
      data: {
        calificacion_activada: true,
        fecha_activacion_calificacion: ahora,
        fechaModificacion: ahora,
      },
    });

    if (resultado.count === 0) {
      // Otra petición la activó concurrentemente (idempotencia)
      const actual = await this.prisma.publicacion.findUnique({
        where: { id: publicacion.id },
        select: {
          id: true,
          calificacion_activada: true,
          fecha_activacion_calificacion: true,
        },
      });

      if (!actual) {
        throw new InternalServerErrorException('No fue posible activar la calificación');
      }

      return {
        publicacionId: actual.id,
        calificacionActivada: actual.calificacion_activada,
        fechaActivacionCalificacion: actual.fecha_activacion_calificacion
          ? new Date(actual.fecha_activacion_calificacion).toISOString()
          : null,
      };
    }

    return {
      publicacionId: publicacion.id,
      calificacionActivada: true,
      fechaActivacionCalificacion: ahora.toISOString(),
    };
  }

  private async construirRespuestaTransaccion(
    idPublicacion: string,
  ): Promise<CierreVentaRespuestaDto> {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: idPublicacion },
      select: {
        id: true,
        calificacion_activada: true,
        estadoPublicacion: { select: { id: true, descripcion: true } },
        usuario: {
          select: {
            id_cuenta: true,
            pNombre: true,
            sNombre: true,
            pApellido: true,
            sApellido: true,
          },
        },
        comprador: {
          select: {
            id_cuenta: true,
            usuario: {
              select: {
                pNombre: true,
                sNombre: true,
                pApellido: true,
                sApellido: true,
              },
            },
          },
        },
      },
    });

    if (publicacion === null || publicacion.comprador === null || publicacion.comprador.usuario === null) {
      throw new InternalServerErrorException(
        'No fue posible construir la transacción de la publicación',
      );
    }

    return {
      id: publicacion.id,
      calificacionActivada: publicacion.calificacion_activada,
      estado: {
        id: publicacion.estadoPublicacion.id,
        descripcion: publicacion.estadoPublicacion.descripcion,
      },
      vendedor: {
        id: publicacion.usuario.id_cuenta,
        nombre: this.construirNombreCompleto(publicacion.usuario),
      },
      comprador: {
        id: publicacion.comprador.id_cuenta,
        nombre: this.construirNombreCompleto(publicacion.comprador.usuario),
      },
    };
  }
}
