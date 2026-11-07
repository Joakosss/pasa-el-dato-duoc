import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AlmacenamientoImagenesService,
  ImagenAlmacenada,
} from '../publicacion/almacenamiento-imagenes.service.js';
import type { ImagenRecibida } from '../publicacion/validar-imagenes.js';
import type { CrearBannerPublicidadDto } from './dto/crear-banner-publicidad.dto.js';
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
}
