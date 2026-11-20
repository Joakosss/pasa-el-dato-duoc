// HU-ADM-04: espejo front de GET /admin/metricas/dashboard (contrato vigente).
// El back calcula bajo demanda y responde 200 con hayDatos=false cuando no
// hay datos; filtros ISO-8601 y sedeId opcional.

export interface MetricasDashboardQueryDTO {
  desde?: string;
  hasta?: string;
  sedeId?: number;
}

export interface DistribucionCategoriaDTO {
  categoriaId: number;
  categoriaNombre: string;
  total: number;
}

export interface DistribucionSedeDTO {
  sedeId: number;
  sedeNombre: string;
  total: number;
}

export interface MetricasDashboardDTO {
  usuariosActivos: number;
  publicaciones: {
    total: number;
    porCategoria: DistribucionCategoriaDTO[];
    porSede: DistribucionSedeDTO[];
  };
  transaccionesTotales: number;
  reportesResueltos: number;
}

export interface DashboardMetricasRespuestaDTO {
  filtrosAplicados: {
    desde: string;
    hasta: string;
    sedeId?: number;
  };
  hayDatos: boolean;
  mensajeSinDatos?: string;
  metricas: MetricasDashboardDTO;
}
