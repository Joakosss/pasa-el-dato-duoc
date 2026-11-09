import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

function recortarSiEsTexto({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function transformarSedes({ value }: { value: unknown }): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === 'string' ? Number(item.trim()) : item,
    );
  }

  if (typeof value === 'string') {
    const normalizado = value.trim();

    if (!normalizado) {
      return [];
    }

    try {
      const parseado: unknown = JSON.parse(normalizado);
      if (Array.isArray(parseado)) {
        return parseado.map((item) =>
          typeof item === 'string' ? Number(item.trim()) : item,
        );
      }

      return parseado;
    } catch {
      return normalizado.split(',').map((item) => Number(item.trim()));
    }
  }

  return value;
}

export class CrearBannerPublicidadDto {
  @Transform(recortarSiEsTexto)
  @IsString({ message: 'El mensaje debe ser un texto' })
  @IsNotEmpty({ message: 'El mensaje es obligatorio' })
  mensaje: string;

  @Transform(recortarSiEsTexto)
  @IsDateString({}, { message: 'La fecha de inicio no es válida' })
  fechaInicio: string;

  @Transform(recortarSiEsTexto)
  @IsDateString({}, { message: 'La fecha de fin no es válida' })
  fechaFin: string;

  @Transform(transformarSedes)
  @IsArray({ message: 'Debe indicar una o más sedes' })
  @ArrayNotEmpty({ message: 'Debe indicar una o más sedes' })
  @IsInt({ each: true, message: 'Cada sede debe ser un identificador numérico' })
  @Min(1, { each: true, message: 'Cada sede debe ser un identificador válido' })
  sedes: number[];
}
