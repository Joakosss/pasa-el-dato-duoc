import type { ID } from "@/domain/types/common";

export interface DatoDTO {
  id: ID;
  title: string;
  content: string;
  authorId: ID;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDatoDTO {
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateDatoDTO {
  title?: string;
  content?: string;
  tags?: string[];
}
