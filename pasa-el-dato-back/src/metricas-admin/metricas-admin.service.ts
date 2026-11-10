import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoReportePublicacion,
  EstadoReporteUsuario,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DashboardMetricasQueryDto } from './dto/dashboard-metricas-query.dto.js';

const MAX_PERIODO_MS = 365 * 24 * 60 * 60 * 1000;
const DEFAULT_PERIODO_MS = 30 * 24 * 60 * 60 * 1000;

type FiltrosNormalizados = {
  desde: Date;
  hasta: Date;
  sedeId?: number;
};

type Distribucion = {
  categoriaId: number;
  categoriaNombre: string;
  total: number;
};

type DistribucionSede = {
  sedeId: number;
  sedeNombre: string;
  total: number;
};

@Injectable()
export class MetricasAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerDashboard(query: DashboardMetricasQueryDto) {
    const filtros = await this.normalizarFiltros(query);

    const publicacionWhere = {
      fechaCreacion: {
        gte: filtros.desde,
        lt: filtros.hasta,
      },
      eliminado: false,
      ...(filtros.sedeId === undefined ? {} : { fk_sede: filtros.sedeId }),
    };

    const actividadWhere = {
      fecha_hora: {
        gte: filtros.desde,
        lt: filtros.hasta,
      },
      fk_cuenta: {
        not: null,
      },
      ...(filtros.sedeId === undefined
        ? {}
        : { cuenta: { usuario: { fk_sede: filtros.sedeId } } }),
    };

    const reportePublicacionWhere = {
      fechaResolucion: {
        gte: filtros.desde,
        lt: filtros.hasta,
      },
      estado: {
        in: [
          EstadoReportePublicacion.RESUELTO,
          EstadoReportePublicacion.DESCARTADO,
        ],
      },
      ...(filtros.sedeId === undefined
        ? {}
        : { publicacion: { fk_sede: filtros.sedeId } }),
    };

    const reporteUsuarioWhere = {
      fechaResolucion: {
        gte: filtros.desde,
        lt: filtros.hasta,
      },
      estado: {
        in: [EstadoReporteUsuario.RESUELTO, EstadoReporteUsuario.DESCARTADO],
      },
      ...(filtros.sedeId === undefined
        ? {}
        : { reportado: { usuario: { fk_sede: filtros.sedeId } } }),
    };

    const [
      usuariosActivosRows,
      publicacionesTotal,
      publicacionesPorCategoria,
      publicacionesPorSede,
      transaccionesTotales,
      reportesPublicacionResueltos,
      reportesUsuarioResueltos,
    ] = await Promise.all([
      this.prisma.log_api.findMany({
        where: actividadWhere,
        select: { fk_cuenta: true },
        distinct: ['fk_cuenta'],
      }),
      this.prisma.publicacion.count({ where: publicacionWhere }),
      this.prisma.publicacion.groupBy({
        by: ['fk_categoria'],
        where: publicacionWhere,
        _count: { _all: true },
      }),
      this.prisma.publicacion.groupBy({
        by: ['fk_sede'],
        where: publicacionWhere,
        _count: { _all: true },
      }),
      this.prisma.publicacion.count({
        where: {
          ...publicacionWhere,
          fk_user_comprador: { not: null },
        },
      }),
      this.prisma.reportePublicacion.count({
        where: reportePublicacionWhere,
      }),
      this.prisma.reporteUsuario.count({
        where: reporteUsuarioWhere,
      }),
    ]);

    const categoriaIds = publicacionesPorCategoria.map(
      ({ fk_categoria }) => fk_categoria,
    );
    const sedeIds = publicacionesPorSede.map(({ fk_sede }) => fk_sede);

    const [categorias, sedes] = await Promise.all([
      this.prisma.categoria.findMany({
        where: { id: { in: categoriaIds } },
        select: { id: true, nombre: true },
      }),
      this.prisma.sede.findMany({
        where: { id: { in: sedeIds } },
        select: { id: true, nombre: true },
      }),
    ]);

    const categoriasPorId = new Map(
      categorias.map((categoria) => [categoria.id, categoria.nombre]),
    );
    const sedesPorId = new Map(
      sedes.map((sede) => [sede.id, sede.nombre]),
    );

    const porCategoria: Distribucion[] = publicacionesPorCategoria.map(
      (grupo) => ({
        categoriaId: grupo.fk_categoria,
        categoriaNombre:
          categoriasPorId.get(grupo.fk_categoria) ?? 'Categoría desconocida',
        total: grupo._count._all,
      }),
    );

    const porSede: DistribucionSede[] = publicacionesPorSede.map((grupo) => ({
      sedeId: grupo.fk_sede,
      sedeNombre: sedesPorId.get(grupo.fk_sede) ?? 'Sede desconocida',
      total: grupo._count._all,
    }));

    const metricas = {
      usuariosActivos: usuariosActivosRows.length,
      publicaciones: {
        total: publicacionesTotal,
        porCategoria,
        porSede,
      },
      transaccionesTotales,
      reportesResueltos:
        reportesPublicacionResueltos + reportesUsuarioResueltos,
    };

    const hayDatos =
      metricas.usuariosActivos > 0 ||
      metricas.publicaciones.total > 0 ||
      metricas.transaccionesTotales > 0 ||
      metricas.reportesResueltos > 0;

    return {
      filtrosAplicados: {
        desde: filtros.desde.toISOString(),
        hasta: filtros.hasta.toISOString(),
        ...(filtros.sedeId === undefined ? {} : { sedeId: filtros.sedeId }),
      },
      hayDatos,
      ...(hayDatos
        ? {}
        : { mensajeSinDatos: 'Sin datos para el periodo o sede seleccionados.' }),
      metricas,
    };
  }

  private async normalizarFiltros(
    query: DashboardMetricasQueryDto,
  ): Promise<FiltrosNormalizados> {
    const ahora = new Date();
    const hasta = query.hasta ? new Date(query.hasta) : ahora;
    const desde = query.desde
      ? new Date(query.desde)
      : new Date(hasta.getTime() - DEFAULT_PERIODO_MS);

    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
      throw new BadRequestException('El rango de fechas no es válido.');
    }

    if (desde >= hasta) {
      throw new BadRequestException(
        'La fecha desde debe ser anterior a la fecha hasta.',
      );
    }

    if (hasta.getTime() - desde.getTime() > MAX_PERIODO_MS) {
      throw new BadRequestException(
        'El rango máximo permitido es de 365 días.',
      );
    }

    if (query.sedeId !== undefined) {
      const sede = await this.prisma.sede.findFirst({
        where: {
          id: query.sedeId,
          eliminado: false,
        },
        select: { id: true },
      });

      if (!sede) {
        throw new NotFoundException('La sede indicada no existe.');
      }
    }

    return {
      desde,
      hasta,
      sedeId: query.sedeId,
    };
  }
}
