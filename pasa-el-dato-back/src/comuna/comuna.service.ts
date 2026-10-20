import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CiudadService } from '../ciudad/ciudad.service.js';
import { ComunaRespuestaDto } from './dto/comuna-respuesta.dto.js';

@Injectable()
export class ComunaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ciudadService: CiudadService,
  ) {}

  async listar(ciudadId: number): Promise<ComunaRespuestaDto[]> {
    await this.ciudadService.asegurarExistencia(ciudadId);
    return this.prisma.comuna.findMany({
      where: { ciudadId },
      select: {
        id: true,
        nombre: true,
        codigoSubdere: true,
        ciudadId: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  }

  // Lanza 404 si la comuna no existe; la usa el filtro de sedes.
  async asegurarExistencia(comunaId: number): Promise<void> {
    const total = await this.prisma.comuna.count({
      where: { id: comunaId },
    });
    if (total === 0) {
      throw new NotFoundException('Comuna no existe');
    }
  }
}
