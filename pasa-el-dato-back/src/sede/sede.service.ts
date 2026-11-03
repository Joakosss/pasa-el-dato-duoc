import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ComunaService } from '../comuna/comuna.service.js';
import { ListarSedesQueryDto } from './dto/listar-sedes-query.dto.js';
import { SedeRespuestaDto } from './dto/sede-respuesta.dto.js';

@Injectable()
export class SedeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly comunaService: ComunaService,
  ) {}

  async listar(
    consulta: ListarSedesQueryDto = {},
  ): Promise<SedeRespuestaDto[]> {
    // Sin parámetros se conserva el comportamiento histórico: sin filtros.
    if (consulta.comunaId === undefined && !consulta.soloDisponibles) {
      return this.prisma.sede.findMany({
        select: {
          id: true,
          nombre: true,
          activa: true,
        },
        orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
      });
    }

    if (consulta.comunaId !== undefined) {
      await this.comunaService.asegurarExistencia(consulta.comunaId);
    }

    return this.prisma.sede.findMany({
      where: {
        ...(consulta.comunaId === undefined
          ? {}
          : { comunaId: consulta.comunaId }),
        // soloDisponibles=true: sedes activas y no eliminadas.
        ...(consulta.soloDisponibles ? { activa: true, eliminado: false } : {}),
      },
      select: {
        id: true,
        nombre: true,
        activa: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  }
}
