import type {
  CategoriaId,
  PublicacionId,
  SedeId,
  TipoVentaId,
} from "@/domain/types/common";

// Catálogo de estados asignables por el propietario (HU-PUB-04).
// Debe coincidir con ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO del back.
export const ESTADOS_PUBLICACION_ASIGNABLES = [
  "En curso",
  "Pausada",
  "Vendida",
] as const;

export type EstadoPublicacionAsignable =
  (typeof ESTADOS_PUBLICACION_ASIGNABLES)[number];

// PATCH /publicaciones/:id/estado (JSON, cookie accessToken).
export interface CambiarEstadoPublicacionRequestDTO {
  estado: EstadoPublicacionAsignable;
}

export interface CambioEstadoPublicacionDTO {
  id: PublicacionId;
  estado: {
    id: number;
    descripcion: string;
  };
}

// Espejo de PublicacionEdicionRespuestaDto del back (GET /publicaciones/:id).
export interface PublicacionDetalleDTO {
  id: PublicacionId;
  titulo: string;
  descripcion: string;
  precio: number;
  sede: {
    id: SedeId;
    nombre: string;
  };
  tipoVenta: {
    id: TipoVentaId;
    nombre: string;
  };
  categoria: {
    id: CategoriaId;
    nombre: string;
  };
  imagenes: ImagenPublicacionCreadaDTO[];
}

// POST /publicaciones (multipart/form-data). Los ids viajan como string en el
// FormData; aquí se modelan como number porque la capa API los serializa.
export interface CrearPublicacionRequestDTO {
  titulo: string;
  descripcion: string;
  precio: number;
  sedeId: SedeId;
  tipoVentaId: TipoVentaId;
  categoriaId: CategoriaId;
  imagenes: File[];
}

// PATCH /publicaciones/:id (multipart/form-data).
// Si `imagenes` viene vacío/ausente, el back conserva las imágenes actuales.
export interface ActualizarPublicacionRequestDTO {
  titulo: string;
  descripcion: string;
  precio: number;
  sedeId: SedeId;
  tipoVentaId: TipoVentaId;
  categoriaId: CategoriaId;
  imagenes?: File[];
}

export interface ImagenPublicacionCreadaDTO {
  idImagen: string;
  url: string;
  orden: number;
}

// Espejo de PublicacionListaRespuestaDto del back (GET /publicaciones).
export interface PublicacionListaDTO {
  id: PublicacionId;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: {
    id: number;
    descripcion: string;
  };
  sede: {
    id: SedeId;
    nombre: string;
  };
  tipoVenta: {
    id: TipoVentaId;
    nombre: string;
  };
  categoria: {
    id: CategoriaId;
    nombre: string;
  };
  imagenes: ImagenPublicacionCreadaDTO[];
}

// Espejo de PublicacionCreadaRespuestaDto del back.
export interface PublicacionCreadaDTO {
  id: PublicacionId;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: {
    id: number;
    descripcion: string;
  };
  sede: {
    id: SedeId;
    nombre: string;
  };
  tipoVenta: {
    id: TipoVentaId;
    nombre: string;
  };
  categoria: {
    id: CategoriaId;
    nombre: string;
  };
  imagenes: ImagenPublicacionCreadaDTO[];
}
