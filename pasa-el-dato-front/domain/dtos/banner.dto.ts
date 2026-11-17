// Contrato front del POST /publicidad/banners (multipart) y de la respuesta
// que el back devuelve al crear el banner (espejo de CrearBannerPublicidadDto
// y BannerPublicidadCreado).
export type EstadoBannerDTO = "PENDIENTE" | "APROBADO" | "RECHAZADO";

export interface CrearBannerRequestDTO {
  imagen: File;
  mensaje: string;
  // ISO 8601 en hora local: inicio 00:00:00.000 y fin 23:59:59.999 de la
  // fecha elegida, para que el back (fin > inicio) acepte periodos de un día.
  fechaInicio: string;
  fechaFin: string;
  sedes: number[];
}

export interface BannerCreadoDTO {
  id: string;
  imagen: string;
  mensaje: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoBannerDTO;
  sedes: Array<{ id: number; nombre: string }>;
}

// ---- Administración (HU-PU-02) ----

// Espejo de BannerAdminDTO / BannerPublicidadAdmin del back.
export interface BannerAdminDTO {
  id: string;
  imagen: string;
  mensaje: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoBannerDTO;
  motivoRechazo: string | null;
  fechaAprobacion: string | null;
  fechaRechazo: string | null;
  marca: { id: string; nombre: string };
  sedes: Array<{ id: number; nombre: string }>;
}

// Parámetros de GET /admin/publicidad/banners.
export interface ListarBannersAdminQueryDTO {
  estado: EstadoBannerDTO;
  page: number;
  pageSize: number;
}

export interface PaginaBannersAdminDTO {
  items: BannerAdminDTO[];
  pagination: { page: number; pageSize: number; total: number };
}

// Cuerpo de POST /admin/publicidad/banners/:id/rechazar (5..500).
export interface RechazarBannerRequestDTO {
  motivo: string;
}

// ---- Catálogo (HU-PU-05) ----

// Item de GET /publicidad/banners/activos: banners APROBADO, vigentes y
// destinados a la sede de la cuenta autenticada (la sede la resuelve el back).
export interface BannerActivoDTO {
  id: string;
  imagenUrl: string;
  mensaje: string;
  inicio: string;
  fin: string;
  marcaNombre: string;
}

export interface BannersActivosRespuestaDTO {
  items: BannerActivoDTO[];
  nextCursor: string | null;
}
