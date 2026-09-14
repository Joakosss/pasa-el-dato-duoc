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

function isUsuarioDTO(dto: CuentaDTO): dto is UsuarioDTO {
  return dto.tipo === "usuario";
}

export const CuentaMapper = {
  toDomain(dto: CuentaDTO): Usuario | Marca {
    if (isUsuarioDTO(dto)) return Usuario.fromJSON(dto);
    return Marca.fromJSON(dto as MarcaDTO);
  },

  toListDomain(dtos: CuentaDTO[]): (Usuario | Marca)[] {
    return dtos.map((dto) => CuentaMapper.toDomain(dto));
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
