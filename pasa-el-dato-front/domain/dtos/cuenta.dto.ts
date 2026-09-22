import type {
  CarreraId,
  CuentaId,
  RolId,
  SedeId,
} from "@/domain/types/common";

// Forma del cable (JSON con fechas string). Sin clave_hash por decisión aprobada.
export interface CuentaBaseDTO {
  id: CuentaId;
  correo: string;
  telefono?: string | null;
  fechaCreacion: string;
  fechaModificacion: string;
  eliminado: boolean;
  owner?: string | null;
  bloqueado: boolean;
  fechaBloqueo?: string | null;
  motivoBloqueo?: string | null;
}

export interface UsuarioDTO extends CuentaBaseDTO {
  run: string;
  pNombre: string;
  sNombre?: string | null;
  pApellido: string;
  sApellido?: string | null;
  rolId: RolId;
  sedeId: SedeId;
  carreraId: CarreraId;
  correoVerificado: boolean;
}

export interface MarcaDTO extends CuentaBaseDTO {
  nombreMarca: string;
}

// Unión solo-front discriminada por forma ('run' in dto).
// El back nunca envía un campo tipo: son dos endpoints separados.

export type CuentaDTO = UsuarioDTO | MarcaDTO;

export interface CreateUsuarioDTO {
  correo: string;
  // Clave en texto plano, solo para crear. Nunca es clave_hash ni se guarda en el model.
  clave: string;
  telefono?: string | null;
  run: string;
  pNombre: string;
  sNombre?: string | null;
  pApellido: string;
  sApellido?: string | null;
  // Rol lo asigna el back. Front envía sede + carrera.
  sedeId: SedeId;
  carreraId: CarreraId;
}

// Forma plana que exige POST /usuario/registro (RegistrarUsuarioDto del back).
export interface RegistrarUsuarioRequestDTO {
  correo: string;
  contrasena: string;
  telefono: string;
  run: string;
  pNombre: string;
  sNombre?: string | null;
  pApellido: string;
  sApellido: string;
  sedeId: number;
  carreraId: number;
}

export interface CreateMarcaDTO {
  correo: string;
  // Clave en texto plano, solo para crear. Nunca es clave_hash ni se guarda en el model.
  clave: string;
  telefono?: string | null;
  nombreMarca: string;
}

export interface UpdateCuentaDTO {
  correo?: string;
  telefono?: string | null;
}
