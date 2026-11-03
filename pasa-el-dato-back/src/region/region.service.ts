import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegionRespuestaDto } from './dto/region-respuesta.dto.js';

@Injectable()
export class RegionService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<RegionRespuestaDto[]> {
    return this.prisma.region.findMany({
      select: {
        id: true,
        nombre: true,
        codigoSubdere: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  }

  // Lanza 404 si la región no existe; la usan los filtros dependientes.
  async asegurarExistencia(regionId: number): Promise<void> {
    const total = await this.prisma.region.count({
      where: { id: regionId },
    });
    if (total === 0) {
      throw new NotFoundException('Región no existe');
    }
  }
}
