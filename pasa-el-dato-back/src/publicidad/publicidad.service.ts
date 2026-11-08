import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AlmacenamientoImagenesService,
  ImagenAlmacenada,
} from '../publicacion/almacenamiento-imagenes.service.js';
import type { ImagenRecibida } from '../publicacion/validar-imagenes.js';
import type { CrearBannerPublicidadDto } from './dto/crear-banner-publicidad.dto.js';
import type { EditarBannerPublicidadDto } from './dto/editar-banner-publicidad.dto.js';
import type { EstadoBannerPublicidad } from '../generated/prisma/enums.js';

export interface BannerPublicidadCreado {
  id: string;
  imagen: string;
  mensaje: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoBannerPublicidad;
  sedes: Array<{ id: number; nombre: string }>;
}

export interface BannerPublicidadAdmin {
  id: string;
  imagen: string;
  mensaje: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoBannerPublicidad;
  motivoRechazo: string | null;
  fechaAprobacion: Date | null;
  fechaRechazo: Date | null;
  marca: { id: string; nombre: string };
  sedes: Array<{ id: number; nombre: string }>;
}

export interface PaginaBannersPublicidadAdmin {
  items: BannerPublicidadAdmin[];
  pagination: { page: number; pageSize: number; total: number };
}

interface AdminBannerRow {
  id: string;
  imagen: string;
  mensaje: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: string;
  motivoRechazo: string | null;
  fechaAprobacion: Date | null;
  fechaRechazo: Date | null;
  marcaId: string;
  marcaNombre: string;
  sedeId: number | null;
  sedeNombre: string | null;
}

@Injectable()
export class PublicidadService {
  constructor(private readonly prisma: PrismaService) {}

  async crearBanner(
    dto: CrearBannerPublicidadDto,
    imagen: ImagenRecibida,
    idCuenta: string,
    almacenamiento: AlmacenamientoImagenesService,
  ): Promise<BannerPublicidadCreado> {
    const marca = await this.prisma.marca.findUnique({
      where: { id_cuenta: idCuenta },
      select: { id_cuenta: true },
    });

    if (!marca) {
      throw new ForbiddenException('La cuenta no corresponde a una marca autorizada');
    }

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);

    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    const sedesIds = [...new Set(dto.sedes)];
    if (sedesIds.length === 0) {
      throw new BadRequestException('Debe indicar una o más sedes');
    }

    const sedes = await this.prisma.sede.findMany({
      where: { id: { in: sedesIds } },
      select: { id: true, nombre: true, activa: true, eliminado: true },
    });

    if (sedes.length !== sedesIds.length) {
      throw new NotFoundException('Una o más sedes no existen');
    }

    const sedeNoDisponible = sedes.find((sede) => !sede.activa || sede.eliminado);
    if (sedeNoDisponible) {
      throw new BadRequestException('Una o más sedes no están disponibles');
    }

    const { resultado } = await almacenamiento.ejecutarConImagenesAlmacenadas(
      [imagen],
      async (imagenesAlmacenadas: ImagenAlmacenada[]) => {
        const imagenAlmacenada = imagenesAlmacenadas[0];

        return this.prisma.$transaction(async (tx) => {
          const banner = await tx.bannerPublicidad.create({
            data: {
              fk_marca: marca.id_cuenta,
              imagen: imagenAlmacenada.url,
              mensaje: dto.mensaje,
              fechaInicio,
              fechaFin,
              estado: 'PENDIENTE',
              sedes: {
                create: sedesIds.map((id) => ({ fk_sede: id })),
              },
            },
            select: {
              id: true,
              imagen: true,
              mensaje: true,
              fechaInicio: true,
              fechaFin: true,
              estado: true,
              sedes: {
                select: {
                  sede: { select: { id: true, nombre: true } },
                },
              },
            },
          });

          return {
            id: banner.id,
            imagen: banner.imagen,
            mensaje: banner.mensaje,
            fechaInicio: banner.fechaInicio,
            fechaFin: banner.fechaFin,
            estado: banner.estado,
            sedes: banner.sedes.map(({ sede }) => sede),
          };
        });
      },
    );

    return resultado;
  }

  async editarBanner(
    id: string,
    dto: EditarBannerPublicidadDto,
    idCuenta: string,
  ): Promise<BannerPublicidadCreado> {
    if (
      dto.mensaje === undefined &&
      dto.fechaInicio === undefined &&
      dto.fechaFin === undefined &&
      dto.sedes === undefined
    ) {
      throw new BadRequestException('Debe indicar al menos un campo para editar');
    }

    return this.prisma.$transaction(async (tx) => {
      const banner = await tx.bannerPublicidad.findUnique({
        where: { id },
        select: {
          id: true,
          fk_marca: true,
          imagen: true,
          mensaje: true,
          fechaInicio: true,
          fechaFin: true,
          estado: true,
          eliminado: true,
          sedes: { select: { fk_sede: true } },
        },
      });

      if (!banner || banner.eliminado) {
        throw new NotFoundException('Banner no encontrado');
      }

      if (banner.fk_marca !== idCuenta) {
        throw new ForbiddenException('No puede editar un banner que no le pertenece');
      }

      const fechaInicio = dto.fechaInicio
        ? new Date(dto.fechaInicio)
        : banner.fechaInicio;
      const fechaFin = dto.fechaFin ? new Date(dto.fechaFin) : banner.fechaFin;

      if (fechaFin <= fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio',
        );
      }

      const sedesIds = dto.sedes
        ? [...new Set(dto.sedes)]
        : banner.sedes.map(({ fk_sede }) => fk_sede);

      if (sedesIds.length === 0) {
        throw new BadRequestException('Debe indicar una o más sedes');
      }

      const sedes = await tx.sede.findMany({
        where: { id: { in: sedesIds } },
        select: { id: true, nombre: true, activa: true, eliminado: true },
      });

      if (sedes.length !== sedesIds.length) {
        throw new NotFoundException('Una o más sedes no existen');
      }

      if (sedes.some((sede) => !sede.activa || sede.eliminado)) {
        throw new BadRequestException('Una o más sedes no están disponibles');
      }

      const ahora = new Date();
      const estado =
        banner.estado === 'RECHAZADO' ? 'PENDIENTE' : banner.estado;

      const actualizado = await tx.bannerPublicidad.update({
        where: { id: banner.id },
        data: {
          ...(dto.mensaje !== undefined ? { mensaje: dto.mensaje } : {}),
          fechaInicio,
          fechaFin,
          estado,
          ...(estado === 'PENDIENTE' && banner.estado === 'RECHAZADO'
            ? {
                motivoRechazo: null,
                fechaRechazo: null,
              }
            : {}),
          fechaModificacion: ahora,
          fk_modificado_por: idCuenta,
          sedes:
            dto.sedes !== undefined
              ? {
                  deleteMany: {},
                  create: sedesIds.map((fk_sede) => ({ fk_sede })),
                }
              : undefined,
        },
        select: {
          id: true,
          imagen: true,
          mensaje: true,
          fechaInicio: true,
          fechaFin: true,
          estado: true,
          sedes: {
            select: {
              sede: { select: { id: true, nombre: true } },
            },
          },
        },
      });

      return {
        id: actualizado.id,
        imagen: actualizado.imagen,
        mensaje: actualizado.mensaje,
        fechaInicio: actualizado.fechaInicio,
        fechaFin: actualizado.fechaFin,
        estado: actualizado.estado,
        sedes: actualizado.sedes.map(({ sede }) => sede),
      };
    });
  }

  async eliminarBanner(id: string, idCuenta: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const banner = await tx.bannerPublicidad.findUnique({
        where: { id },
        select: {
          id: true,
          fk_marca: true,
          eliminado: true,
        },
      });

      if (!banner) {
        throw new NotFoundException('Banner no encontrado');
      }

      if (banner.fk_marca !== idCuenta) {
        throw new ForbiddenException(
          'No puede eliminar un banner que no le pertenece',
        );
      }

      if (banner.eliminado) {
        return;
      }

      await tx.bannerPublicidad.updateMany({
        where: {
          id: banner.id,
          fk_marca: idCuenta,
          eliminado: false,
        },
        data: {
          eliminado: true,
          fechaModificacion: new Date(),
          fk_modificado_por: idCuenta,
        },
      });
    });
  }

  async listarBannersAdmin(
    estado: EstadoBannerPublicidad,
    page: number,
    pageSize: number,
  ): Promise<PaginaBannersPublicidadAdmin> {
    const offset = (page - 1) * pageSize;
    const rows = await this.prisma.$queryRawUnsafe<AdminBannerRow[]>(
      `SELECT b.id, b.imagen, b.mensaje, b.fecha_inicio AS "fechaInicio",
              b.fecha_fin AS "fechaFin", b.estado::text AS estado,
              b.motivo_rechazo AS "motivoRechazo",
              b.fecha_aprobacion AS "fechaAprobacion",
              b.fecha_rechazo AS "fechaRechazo",
              m.id_cuenta AS "marcaId", m.nombre AS "marcaNombre",
              s.id AS "sedeId", s.nombre AS "sedeNombre"
         FROM banner_publicidad b
         JOIN marca m ON m.id_cuenta = b.fk_marca
         LEFT JOIN banner_sede bs ON bs.fk_banner_publicidad = b.id
         LEFT JOIN sede s ON s.id = bs.fk_sede
        WHERE b.eliminado = false AND b.estado = $1::"EstadoBannerPublicidad"
        ORDER BY b.fecha_creacion ASC
        LIMIT $2 OFFSET $3`,
      estado,
      pageSize,
      offset,
    );
    const totalRows = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*)::bigint AS count FROM banner_publicidad
        WHERE eliminado = false AND estado = $1::"EstadoBannerPublicidad"`,
      estado,
    );
    return {
      items: this.agruparBannersAdmin(rows),
      pagination: { page, pageSize, total: Number(totalRows[0]?.count ?? 0) },
    };
  }

  async aprobarBanner(id: string, idAdministrador: string): Promise<BannerPublicidadAdmin> {
    const ahora = new Date();
    return this.prisma.$transaction(async (tx) => {
      const banner = await tx.$queryRawUnsafe<Array<{ fk_marca: string; fechaFin: Date; estado: string }>>(
        `SELECT fk_marca, fecha_fin AS "fechaFin", estado::text AS estado
           FROM banner_publicidad WHERE id = $1::uuid AND eliminado = false FOR UPDATE`,
        id,
      );
      const actual = banner[0];
      if (!actual) throw new NotFoundException('Banner no encontrado');
      if (actual.estado !== 'PENDIENTE') throw new ConflictException('El banner ya fue resuelto');
      if (actual.fechaFin < ahora) {
        throw new UnprocessableEntityException('El banner ya no tiene un periodo de vigencia disponible');
      }
      const activos = await tx.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT count(*)::bigint AS count FROM banner_publicidad
          WHERE fk_marca = $1::uuid AND eliminado = false AND estado = 'APROBADO'
            AND fecha_inicio <= $2 AND fecha_fin >= $2`,
        actual.fk_marca,
        ahora,
      );
      if (Number(activos[0]?.count ?? 0) >= 3) {
        throw new ConflictException('La marca alcanzó el límite de 3 banners activos simultáneos');
      }
      await tx.$executeRawUnsafe(
        `UPDATE banner_publicidad
            SET estado = 'APROBADO', fecha_aprobacion = $1, fecha_rechazo = NULL,
                motivo_rechazo = NULL, fecha_modificacion = $1, fk_modificado_por = $2::uuid
          WHERE id = $3::uuid`,
        ahora,
        idAdministrador,
        id,
      );
      return this.obtenerBannerAdmin(tx, id);
    });
  }

  async rechazarBanner(id: string, motivo: string, idAdministrador: string): Promise<BannerPublicidadAdmin> {
    const ahora = new Date();
    const motivoNormalizado = motivo.trim();
    return this.prisma.$transaction(async (tx) => {
      const banner = await tx.$queryRawUnsafe<Array<{ fk_marca: string; estado: string }>>(
        `SELECT fk_marca, estado::text AS estado FROM banner_publicidad
          WHERE id = $1::uuid AND eliminado = false FOR UPDATE`,
        id,
      );
      const actual = banner[0];
      if (!actual) throw new NotFoundException('Banner no encontrado');
      if (actual.estado !== 'PENDIENTE') throw new ConflictException('El banner ya fue resuelto');
      await tx.$executeRawUnsafe(
        `UPDATE banner_publicidad
            SET estado = 'RECHAZADO', motivo_rechazo = $1, fecha_rechazo = $2,
                fecha_aprobacion = NULL, fecha_modificacion = $2, fk_modificado_por = $3::uuid
          WHERE id = $4::uuid`,
        motivoNormalizado,
        ahora,
        idAdministrador,
        id,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO notificacion_marca (fk_marca, fk_banner, tipo, mensaje)
         VALUES ($1::uuid, $2::uuid, 'BANNER_RECHAZADO', $3)`,
        actual.fk_marca,
        id,
        `El banner fue rechazado: ${motivoNormalizado}`,
      );
      return this.obtenerBannerAdmin(tx, id);
    });
  }

  private async obtenerBannerAdmin(
    tx: { $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T> },
    id: string,
  ): Promise<BannerPublicidadAdmin> {
    const rows = await tx.$queryRawUnsafe<AdminBannerRow[]>(
      `SELECT b.id, b.imagen, b.mensaje, b.fecha_inicio AS "fechaInicio",
              b.fecha_fin AS "fechaFin", b.estado::text AS estado,
              b.motivo_rechazo AS "motivoRechazo",
              b.fecha_aprobacion AS "fechaAprobacion",
              b.fecha_rechazo AS "fechaRechazo",
              m.id_cuenta AS "marcaId", m.nombre AS "marcaNombre",
              s.id AS "sedeId", s.nombre AS "sedeNombre"
         FROM banner_publicidad b JOIN marca m ON m.id_cuenta = b.fk_marca
         LEFT JOIN banner_sede bs ON bs.fk_banner_publicidad = b.id
         LEFT JOIN sede s ON s.id = bs.fk_sede
        WHERE b.id = $1::uuid`,
      id,
    );
    return this.agruparBannersAdmin(rows)[0];
  }

  private agruparBannersAdmin(rows: AdminBannerRow[]): BannerPublicidadAdmin[] {
    const agrupados = new Map<string, BannerPublicidadAdmin>();
    for (const row of rows) {
      const item = agrupados.get(row.id) ?? {
        id: row.id,
        imagen: row.imagen,
        mensaje: row.mensaje,
        fechaInicio: row.fechaInicio,
        fechaFin: row.fechaFin,
        estado: row.estado as EstadoBannerPublicidad,
        motivoRechazo: row.motivoRechazo,
        fechaAprobacion: row.fechaAprobacion,
        fechaRechazo: row.fechaRechazo,
        marca: { id: row.marcaId, nombre: row.marcaNombre },
        sedes: [] as Array<{ id: number; nombre: string }>,
      };
      if (row.sedeId !== null && row.sedeNombre !== null) {
        item.sedes.push({ id: row.sedeId, nombre: row.sedeNombre });
      }
      agrupados.set(row.id, item);
    }
    return [...agrupados.values()];
  }
}
