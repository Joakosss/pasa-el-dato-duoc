import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CiudadService } from '../ciudad/ciudad.service.js';
import { RegionService } from '../region/region.service.js';
import { ComunaRespuestaDto } from './dto/comuna-respuesta.dto.js';
import { ListarComunasQueryDto } from './dto/listar-comunas-query.dto.js';

@Injectable()
export class ComunaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ciudadService: CiudadService,
    private readonly regionService: RegionService,
  ) {}

  async listar(
    consulta: ListarComunasQueryDto,
  ): Promise<ComunaRespuestaDto[]> {
    const { regionId, ciudadId } = consulta;

    if ((regionId === undefined) === (ciudadId === undefined)) {
      throw new BadRequestException(
        'Debe indicar exactamente uno de regionId o ciudadId',
      );
    }

    if (regionId !== undefined && ciudadId === undefined) {
      await this.regionService.asegurarExistencia(regionId);
      return this.prisma.comuna.findMany({
        where: { regionId },
        select: {
          id: true,
          nombre: true,
          codigoSubdere: true,
          regionId: true,
        },
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      });
    }

    // Gracias a la guarda previa, aquí ciudadId siempre está definido.
    await this.ciudadService.asegurarExistencia(ciudadId!);
    return this.prisma.comuna.findMany({
      where: { ciudades: { some: { id: ciudadId! } } },
      select: {
        id: true,
        nombre: true,
        codigoSubdere: true,
        regionId: true,
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
