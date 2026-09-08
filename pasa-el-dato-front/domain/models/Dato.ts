import type { ID } from "@/domain/types/common";
import type { DatoDTO } from "@/domain/dtos/dato.dto";

interface DatoProps {
  id: ID;
  title: string;
  content: string;
  authorId: ID;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Dato {
  readonly id: ID;
  title: string;
  content: string;
  readonly authorId: ID;
  tags: string[];
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: DatoProps) {
    this.id = props.id;
    this.title = props.title;
    this.content = props.content;
    this.authorId = props.authorId;
    this.tags = props.tags;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromJSON(dto: DatoDTO): Dato {
    return new Dato({
      id: dto.id,
      title: dto.title,
      content: dto.content,
      authorId: dto.authorId,
      tags: dto.tags ?? [],
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  static createNew(props: {
    title: string;
    content: string;
    authorId: ID;
    tags?: string[];
  }): Omit<DatoProps, "id" | "createdAt" | "updatedAt"> {
    return {
      title: props.title.trim(),
      content: props.content.trim(),
      authorId: props.authorId,
      tags: props.tags ?? [],
    };
  }

  toJSON(): DatoDTO {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      authorId: this.authorId,
      tags: [...this.tags],
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  get excerpt(): string {
    return this.content.length > 140
      ? `${this.content.slice(0, 140)}…`
      : this.content;
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }
}
