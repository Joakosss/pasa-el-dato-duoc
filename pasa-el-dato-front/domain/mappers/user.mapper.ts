import type { CreateUserDTO, UpdateUserDTO, UserDTO } from "@/domain/dtos/user.dto";
import { User } from "@/domain/models/User";

export const UserMapper = {
  toDomain(dto: UserDTO): User {
    return User.fromJSON(dto);
  },

  toListDomain(dtos: UserDTO[]): User[] {
    return dtos.map((dto) => User.fromJSON(dto));
  },

  toCreatePayload(input: { name: string; email: string; password: string }): CreateUserDTO {
    return {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };
  },

  toUpdatePayload(user: User): UpdateUserDTO {
    return {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  },
};
