import type {
  EscuelaIdMomentaneo,
  CarreraIdMomentaneo,
  ID,
} from "@/domain/types/common";

// TODO[MOMENTANEO]: reemplazar por contrato back de ESCUELA / CARRERA / SEDE.
export interface EscuelaDTO {
  id: EscuelaIdMomentaneo;
  nombre: string;
}

export interface CarreraDTO {
  id: CarreraIdMomentaneo;
  nombre: string;
  escuelaId: EscuelaIdMomentaneo;
}

export interface SedeDTO {
  id: ID;
  nombre: string;
}
