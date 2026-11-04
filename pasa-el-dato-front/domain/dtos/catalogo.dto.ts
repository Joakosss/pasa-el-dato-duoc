import type {
  EscuelaId,
  CarreraId,
  SedeId,
  CategoriaId,
  TipoVentaId,
} from "@/domain/types/common";

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

export interface CategoriaDTO {
  id: CategoriaId;
  nombre: string;
}

export interface TipoVentaDTO {
  id: TipoVentaId;
  nombre: string;
}
