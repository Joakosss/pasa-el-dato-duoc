import type { ID } from "@/domain/types/common";
import type {
  CreateMarcaDTO,
  CreateUsuarioDTO,
  UpdateCuentaDTO,
} from "@/domain/dtos/cuenta.dto";
import type { Cuenta } from "@/domain/models/Cuenta";
import type { Usuario } from "@/domain/models/Usuario";
import type { Marca } from "@/domain/models/Marca";

// Contrato del agregado CUENTA (1 cuenta = 1 perfil usuario o marca).
export interface CuentaRepository {
  findById(id: ID): Promise<Cuenta | null>;
  findUsuario(id: ID): Promise<Usuario | null>;
  findMarca(id: ID): Promise<Marca | null>;
  createUsuario(payload: CreateUsuarioDTO): Promise<Usuario>;
  createMarca(payload: CreateMarcaDTO): Promise<Marca>;
  update(id: ID, payload: UpdateCuentaDTO): Promise<Cuenta>;
  updateBloqueo(id: ID, bloqueado: boolean, motivo?: string | null): Promise<Cuenta>;
}
