// HU-ADM-01/02: espejos front del back admin (solo lectura/acción).
// Listados solo PENDIENTE (contrato vigente), detalle por id.
// Validaciones espejo: bloqueo/advertencia USU ≥3, advertencia PUB 1..1000,
// motivo retiro PUB opcional ≤1000 (trim).

export type EstadoReporteAdmin =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "RESUELTO"
  | "DESCARTADO";

export type ResolucionReporteUsuarioAdmin =
  | "BLOQUEO"
  | "ADVERTENCIA"
  | "DESCARTE";

export type ResolucionReportePublicacionAdmin =
  | "RETIRO_PUBLICACION"
  | "ADVERTENCIA"
  | "DESCARTE";

export const MOTIVO_BLOQUEO_MIN_LEN = 3 as const;
export const MENSAJE_ADVERTENCIA_USUARIO_MIN_LEN = 3 as const;
export const MENSAJE_ADVERTENCIA_PUB_MAX_LEN = 1000 as const;
export const MOTIVO_RETIRO_MAX_LEN = 1000 as const;

interface CuentaReporteAdmin {
  id: string;
  correo: string;
}

interface NombreUsuarioReporte {
  pNombre: string;
  sNombre: string | null;
  pApellido: string;
  sApellido: string;
}

export interface ReporteUsuarioListaDTO {
  id: string;
  descripcion: string;
  estado: EstadoReporteAdmin;
  fechaCreacion: string;
  reportado: {
    id: string;
    correo: string;
    bloqueado: boolean;
    usuario: (NombreUsuarioReporte & {
      rol_usuario: { descripcion: string };
    }) | null;
  };
  adminAsignado: CuentaReporteAdmin | null;
}

export interface ReporteUsuarioDetalleDTO {
  id: string;
  descripcion: string;
  estado: EstadoReporteAdmin;
  fechaCreacion: string;
  fechaResolucion: string | null;
  resolucion: ResolucionReporteUsuarioAdmin | null;
  mensajeAdvertencia: string | null;
  motivoBloqueo: string | null;
  reportado: {
    id: string;
    correo: string;
    bloqueado: boolean;
    eliminado: boolean;
    aprobada: boolean;
    fechaBloqueo: string | null;
    motivoBloqueo: string | null;
    usuario: {
      pNombre: string;
      sNombre: string | null;
      pApellido: string;
      sApellido: string;
      rol_usuario: { descripcion: string };
      sede: { id: number; nombre: string };
      carrera: { id: number; nombre: string };
    } | null;
  };
  adminAsignado: CuentaReporteAdmin | null;
}

export interface ReportePublicacionListaDTO {
  id: string;
  motivo: string;
  comentarios: string | null;
  estado: EstadoReporteAdmin;
  fechaCreacion: string;
  publicacion: {
    id: string;
    titulo: string;
    precio: number;
    eliminado: boolean;
    estadoPublicacion: { id: number; descripcion: string };
    usuario: {
      id_cuenta: string;
      cuenta: { correo: string };
    };
  };
  reportante: CuentaReporteAdmin;
  adminAsignado: CuentaReporteAdmin | null;
}

export interface ReportePublicacionDetalleDTO {
  id: string;
  motivo: string;
  comentarios: string | null;
  estado: EstadoReporteAdmin;
  fechaCreacion: string;
  fechaModificacion: string;
  fechaResolucion: string | null;
  resolucion: ResolucionReportePublicacionAdmin | null;
  mensajeAdvertencia: string | null;
  avisoVendedorRegistrado: boolean;
  avisoVendedorFecha: string | null;
  publicacion: {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    eliminado: boolean;
    estadoPublicacion: { id: number; descripcion: string };
    tipoVenta: { id: number; nombre: string };
    categoria: { id: number; nombre: string };
    sede: { id: number; nombre: string };
    usuario: {
      id_cuenta: string;
      cuenta: { correo: string };
      pNombre: string;
      sNombre: string | null;
      pApellido: string;
      sApellido: string;
    };
    imagenes: Array<{ idImagen: string; url: string; orden: number }>;
  };
  reportante: CuentaReporteAdmin;
  adminAsignado: CuentaReporteAdmin | null;
}

export interface BloquearUsuarioRequestDTO {
  motivo: string;
}

export interface AdvertirRequestDTO {
  mensaje: string;
}

export interface RetirarPublicacionRequestDTO {
  motivo?: string;
}
