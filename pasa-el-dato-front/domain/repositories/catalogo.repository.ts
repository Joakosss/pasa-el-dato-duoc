import type {
  CarreraDTO,
  EscuelaDTO,
  SedeDTO,
} from "@/domain/dtos/catalogo.dto";
import type { EscuelaIdMomentaneo } from "@/domain/types/common";

// Contrato catálogo sede / escuela / carrera. Solo lectura para registro.
// TODO[MOMENTANEO]: implementar con fetch cuando exista contrato back.
export interface CatalogoRepository {
  listSedes(): Promise<SedeDTO[]>;
  listEscuelas(): Promise<EscuelaDTO[]>;
  listCarrerasByEscuela(escuelaId: EscuelaIdMomentaneo): Promise<CarreraDTO[]>;
}
