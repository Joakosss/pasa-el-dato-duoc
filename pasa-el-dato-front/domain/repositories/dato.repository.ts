import type { ID } from "@/domain/types/common";
import type { CreateDatoDTO, UpdateDatoDTO } from "@/domain/dtos/dato.dto";
import type { Dato } from "@/domain/models/Dato";

export interface DatoRepository {
  findAll(): Promise<Dato[]>;
  findById(id: ID): Promise<Dato | null>;
  create(payload: CreateDatoDTO): Promise<Dato>;
  update(id: ID, payload: UpdateDatoDTO): Promise<Dato>;
  remove(id: ID): Promise<void>;
}
