import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PublicacionService {
  constructor(private readonly prisma: PrismaService) {}

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
