import type {
  CreateMarcaDTO,
  CreateUsuarioDTO,
  CuentaDTO,
  MarcaDTO,
  RegistrarUsuarioRequestDTO,
  UpdateCuentaDTO,
  UsuarioDTO,
} from "@/domain/dtos/cuenta.dto";
import type { CarreraDTO } from "@/domain/dtos/catalogo.dto";
import type {
  RegistroUsuarioBorrador,
  SnapshotsRegistro,
} from "@/domain/dtos/registro.dto";
import type {
  CarreraIdMomentaneo,
  EscuelaIdMomentaneo,
} from "@/domain/types/common";
import type { Cuenta } from "@/domain/models/Cuenta";
import { Usuario } from "@/domain/models/Usuario";
import { Marca } from "@/domain/models/Marca";

// Discriminación por forma: el back no envía campo tipo.
// GET /usuarios -> UsuarioDTO (tiene run), GET /marcas -> MarcaDTO (tiene nombreMarca).
export function isUsuarioDTO(dto: CuentaDTO): dto is UsuarioDTO {
  return "run" in dto;
}

export function isMarcaDTO(dto: CuentaDTO): dto is MarcaDTO {
  return "nombreMarca" in dto;
}

// Carrera implica escuela. Valida coherencia antes de armar payload.
export function esCarreraDeEscuela(
  carreras: CarreraDTO[],
  carreraId: CarreraIdMomentaneo,
  escuelaId: EscuelaIdMomentaneo,
): boolean {
  return carreras.some((c) => c.id === carreraId && c.escuelaId === escuelaId);
}

export interface ValidacionBorrador {
  ok: boolean;
  error?: string;
}

// Validación central del borrador antes de crear. Solo front, sin fetch.
export function validarBorradorParaCrear(
  borrador: RegistroUsuarioBorrador,
  snapshots: SnapshotsRegistro,
  carreras: CarreraDTO[],
): ValidacionBorrador {
  if (!snapshots.runNormalizado || !snapshots.correoNormalizado) {
    return { ok: false, error: "Vuelve al paso Cuenta y valida RUT y correo." };
  }
  if (
    borrador.pNombre.trim().length === 0 ||
    borrador.pApellido.trim().length === 0 ||
    borrador.sApellido.trim().length === 0 ||
    borrador.telefono.trim().length === 0 ||
    borrador.sedeId.length === 0 ||
    borrador.escuelaId.length === 0 ||
    borrador.carreraId.length === 0
  ) {
    return { ok: false, error: "Completa nombres, apellidos, teléfono, sede, escuela y carrera." };
  }
  if (!Number.isInteger(Number(borrador.sedeId)) || !Number.isInteger(Number(borrador.carreraId))) {
    return { ok: false, error: "La sede o carrera elegida no es válida." };
  }
  if (!esCarreraDeEscuela(carreras, borrador.carreraId, borrador.escuelaId)) {
    return { ok: false, error: "La carrera no pertenece a la escuela elegida." };
  }
  if (!borrador.clave) {
    return { ok: false, error: "Ingresa tu contraseña." };
  }
  return { ok: true };
}

export const CuentaMapper = {
  toUsuario(dto: UsuarioDTO): Usuario {
    return Usuario.fromJSON(dto);
  },

  toListUsuario(dtos: UsuarioDTO[]): Usuario[] {
    return dtos.map((dto) => Usuario.fromJSON(dto));
  },

  toMarca(dto: MarcaDTO): Marca {
    return Marca.fromJSON(dto);
  },

  toListMarca(dtos: MarcaDTO[]): Marca[] {
    return dtos.map((dto) => Marca.fromJSON(dto));
  },

  toCreateUsuarioPayload(
    borrador: RegistroUsuarioBorrador,
    snapshots: SnapshotsRegistro,
  ): CreateUsuarioDTO {
    return {
      correo: (snapshots.correoNormalizado ?? borrador.correo).trim().toLowerCase(),
      clave: borrador.clave,
      telefono: borrador.telefono?.trim() || null,
      run: (snapshots.runNormalizado ?? borrador.run).trim(),
      pNombre: borrador.pNombre.trim(),
      sNombre: borrador.sNombre?.trim() || null,
      pApellido: borrador.pApellido.trim(),
      sApellido: borrador.sApellido?.trim() || null,
      sedeId: borrador.sedeId,
      carreraId: borrador.carreraId,
    };
  },

  // Adapta borrador + snapshots a la forma plana de POST /usuario/registro.
  // clave -> contrasena, ids string -> number, teléfono sin espacios.
  toRegistrarUsuarioRequest(
    borrador: RegistroUsuarioBorrador,
    snapshots: SnapshotsRegistro,
  ): RegistrarUsuarioRequestDTO {
    return {
      correo: (snapshots.correoNormalizado ?? borrador.correo).trim().toLowerCase(),
      contrasena: borrador.clave,
      telefono: borrador.telefono.replace(/[\s-]/g, ""),
      run: (snapshots.runNormalizado ?? borrador.run).trim(),
      pNombre: borrador.pNombre.trim(),
      sNombre: borrador.sNombre?.trim() || null,
      pApellido: borrador.pApellido.trim(),
      sApellido: borrador.sApellido.trim(),
      sedeId: Number(borrador.sedeId),
      carreraId: Number(borrador.carreraId),
    };
  },

  toCreateMarcaPayload(input: {    correo: string;
    clave: string;
    telefono?: string | null;
    nombreMarca: string;
  }): CreateMarcaDTO {
    return {
      correo: input.correo.trim().toLowerCase(),
      clave: input.clave,
      telefono: input.telefono?.trim() || null,
      nombreMarca: input.nombreMarca.trim(),
    };
  },

  toUpdatePayload(cuenta: Cuenta): UpdateCuentaDTO {
    return {
      correo: cuenta.correo,
      telefono: cuenta.telefono,
    };
  },
};
