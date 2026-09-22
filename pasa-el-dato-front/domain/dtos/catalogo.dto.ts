import type { EscuelaId, CarreraId, SedeId } from "@/domain/types/common";

export interface EscuelaDTO {
  id: EscuelaId;
  nombre: string;
}

export interface CarreraDTO {
  id: CarreraId;
  nombre: string;
  escuelaId: EscuelaId;
}

export interface SedeDTO {
  id: SedeId;
  nombre: string;
  activa: boolean;
}
