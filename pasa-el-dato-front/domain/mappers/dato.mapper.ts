import type { CreateDatoDTO, DatoDTO, UpdateDatoDTO } from "@/domain/dtos/dato.dto";
import { Dato } from "@/domain/models/Dato";

export const DatoMapper = {
  toDomain(dto: DatoDTO): Dato {
    return Dato.fromJSON(dto);
  },

  toListDomain(dtos: DatoDTO[]): Dato[] {
    return dtos.map((dto) => Dato.fromJSON(dto));
  },

  toCreatePayload(input: { title: string; content: string; tags?: string[] }): CreateDatoDTO {
    return {
      title: input.title.trim(),
      content: input.content.trim(),
      tags: input.tags ?? [],
    };
  },

  toUpdatePayload(dato: Dato): UpdateDatoDTO {
    return {
      title: dato.title,
      content: dato.content,
      tags: [...dato.tags],
    };
  },
};
