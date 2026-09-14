export type ID = string;

export type CuentaTipo = "usuario" | "marca";

// TODO[TEMPORAL]: reemplazar por IDs reales de ROL_USUARIO / SEDE cuando existan esas tablas.
export type RolIdTemporal = string;
export type SedeIdTemporal = string;

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
