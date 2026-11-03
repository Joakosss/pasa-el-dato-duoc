import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CategoriaRespuestaDto } from './dto/categoria-respuesta.dto.js';

@Injectable()
export class CategoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<CategoriaRespuestaDto[]> {
    return this.prisma.categoria.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  }

  async obtenerPorId(id: number): Promise<CategoriaRespuestaDto> {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return categoria;
  }
}
