import type {
  CategoriaId,
  CuentaId,
  PublicacionId,
  SedeId,
  TipoVentaId,
} from "@/domain/types/common";

// Catálogo de estados asignables por el propietario (HU-PUB-04).
// Debe coincidir con ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO del back
// (PATCH /publicaciones/:id/estado). "Vendido" no es asignable por este
// endpoint: requiere POST /publicaciones/:id/cierre-venta con compradorId
// (HU-COM-01).
export const ESTADOS_PUBLICACION_ASIGNABLES = [
  "En curso",
  "Pausada",
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

// HU-COM-01: cierre de venta. Espejo de CerrarVentaDto del back
// (POST /publicaciones/:id/cierre-venta). compradorId es el UUID de
// Cuenta.id_cuenta del comprador registrado.
export interface CerrarVentaRequestDTO {
  compradorId: CuentaId;
}

// HU-COM-01: espejo de CierreVentaRespuestaDto del back (cierre y consulta
// GET /publicaciones/:id/transaccion). Expone las tres partes: publicación,
// vendedor y comprador.
export interface CierreVentaDTO {
  id: PublicacionId;
  calificacionActivada: boolean;
  estado: {
    id: number;
    descripcion: string;
  };
  vendedor: {
    id: CuentaId;
    nombre: string;
  };
  comprador: {
    id: CuentaId;
    nombre: string;
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
