import type {
  CarreraDTO,
  EscuelaDTO,
  SedeDTO,
} from "@/domain/dtos/catalogo.dto";
import type { EscuelaId } from "@/domain/types/common";

// Contrato catálogo sede / escuela / carrera. Solo lectura para registro.
export interface CatalogoRepository {
  listSedes(): Promise<SedeDTO[]>;
  listEscuelas(): Promise<EscuelaDTO[]>;
  listCarrerasByEscuela(escuelaId: EscuelaId): Promise<CarreraDTO[]>;
}
