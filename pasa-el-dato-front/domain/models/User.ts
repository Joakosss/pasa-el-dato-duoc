import type { ID } from "@/domain/types/common";
import type { UserDTO } from "@/domain/dtos/user.dto";

interface UserProps {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: ID;
  name: string;
  email: string;
  avatarUrl: string | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.avatarUrl = props.avatarUrl ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromJSON(dto: UserDTO): User {
    return new User({
      id: dto.id,
      name: dto.name,
      email: dto.email,
      avatarUrl: dto.avatarUrl ?? null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  toJSON(): UserDTO {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  get displayName(): string {
    return this.name.trim() || this.email;
  }

  get initials(): string {
    return this.name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
}
