import type { ID } from "@/domain/types/common";
import type { CreateUserDTO, UpdateUserDTO } from "@/domain/dtos/user.dto";
import type { User } from "@/domain/models/User";

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: ID): Promise<User | null>;
  create(payload: CreateUserDTO): Promise<User>;
  update(id: ID, payload: UpdateUserDTO): Promise<User>;
  remove(id: ID): Promise<void>;
}
