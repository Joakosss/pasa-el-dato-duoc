import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearPalabraBloqueadaDto } from './palabras-bloqueadas.dto.js';

export function normalizarTermino(termino: string): string {
  const normalizado = termino.trim().toLocaleLowerCase('es-CL');

  if (!normalizado) {
    throw new BadRequestException(
      'El término debe contener al menos un carácter no vacío.',
    );
  }

  return normalizado;
}

@Injectable()
export class PalabrasBloqueadasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    return this.prisma.palabraBloqueada.findMany({
      orderBy: [{ termino: 'asc' }],
      select: {
        id: true,
        termino: true,
        fechaCreacion: true,
      },
    });
  }

  async crear(dto: CrearPalabraBloqueadaDto) {
    const termino = normalizarTermino(dto.termino);

    try {
      return await this.prisma.palabraBloqueada.create({
        data: { termino },
        select: {
          id: true,
          termino: true,
          fechaCreacion: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'La palabra bloqueada ya existe en la lista.',
        );
      }

      throw error;
    }
  }

  async eliminar(id: string): Promise<void> {
    try {
      await this.prisma.palabraBloqueada.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('La palabra bloqueada no existe.');
      }

      throw error;
    }
  }

  async obtenerTerminosVigentes(): Promise<string[]> {
    const palabras = await this.prisma.palabraBloqueada.findMany({
      orderBy: [{ termino: 'asc' }],
      select: { termino: true },
    });

    return palabras.map(({ termino }) => termino);
  }

  async contieneTerminoExacto(termino: string): Promise<boolean> {
    const terminoNormalizado = normalizarTermino(termino);
    const encontrado = await this.prisma.palabraBloqueada.findUnique({
      where: { termino: terminoNormalizado },
      select: { id: true },
    });

    return encontrado !== null;
  }
}
