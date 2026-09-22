import type { CuentaId } from "@/domain/types/common";
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
  findById(id: CuentaId): Promise<Cuenta | null>;
  findUsuario(id: CuentaId): Promise<Usuario | null>;
  findMarca(id: CuentaId): Promise<Marca | null>;
  createUsuario(payload: CreateUsuarioDTO): Promise<Usuario>;
  createMarca(payload: CreateMarcaDTO): Promise<Marca>;
  update(id: CuentaId, payload: UpdateCuentaDTO): Promise<Cuenta>;
  updateBloqueo(id: CuentaId, bloqueado: boolean, motivo?: string | null): Promise<Cuenta>;
}
