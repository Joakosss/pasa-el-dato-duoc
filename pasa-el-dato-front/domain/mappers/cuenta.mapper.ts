import type {
  CreateMarcaDTO,
  CreateUsuarioDTO,
  CuentaDTO,
  MarcaDTO,
  UsuarioDTO,
} from "@/domain/dtos/cuenta.dto";
import type { Cuenta } from "@/domain/models/Cuenta";
import { Usuario } from "@/domain/models/Usuario";
import { Marca } from "@/domain/models/Marca";

// Discriminación por forma: el back no envía campo tipo.
// GET /usuarios -> UsuarioDTO (tiene run), GET /marcas -> MarcaDTO (tiene nombreMarca).
export function isUsuarioDTO(dto: CuentaDTO): dto is UsuarioDTO {
  return "run" in dto;
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

  toCreateUsuarioPayload(input: {
    correo: string;
    clave: string;
    telefono?: string | null;
    run: string;
    pNombre: string;
    sNombre?: string | null;
    pApellido: string;
    sApellido?: string | null;
    rolId: string;
    sedeId: string;
  }): CreateUsuarioDTO {
    return {
      correo: input.correo.trim().toLowerCase(),
      clave: input.clave,
      telefono: input.telefono?.trim() || null,
      run: input.run.trim(),
      pNombre: input.pNombre.trim(),
      sNombre: input.sNombre?.trim() || null,
      pApellido: input.pApellido.trim(),
      sApellido: input.sApellido?.trim() || null,
      rolId: input.rolId,
      sedeId: input.sedeId,
    };
  },

  toCreateMarcaPayload(input: {
    correo: string;
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

  toUpdatePayload(cuenta: Cuenta) {
    return {
      correo: cuenta.correo,
      telefono: cuenta.telefono,
    };
  },
};
