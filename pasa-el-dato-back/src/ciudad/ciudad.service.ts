import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CiudadRespuestaDto } from './dto/ciudad-respuesta.dto.js';
import { RegionService } from '../region/region.service.js';

@Injectable()
export class CiudadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly regionService: RegionService,
  ) {}

  async listar(regionId: number): Promise<CiudadRespuestaDto[]> {
    await this.regionService.asegurarExistencia(regionId);
    return this.prisma.ciudad.findMany({
      where: { regionId },
      select: {
        id: true,
        idEntidad: true,
        nombre: true,
        regionId: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  }

  // Lanza 404 si la ciudad no existe; la usan los filtros dependientes.
  async asegurarExistencia(ciudadId: number): Promise<void> {
    const total = await this.prisma.ciudad.count({
      where: { id: ciudadId },
    });
    if (total === 0) {
      throw new NotFoundException('Ciudad no existe');
    }
  }
}
