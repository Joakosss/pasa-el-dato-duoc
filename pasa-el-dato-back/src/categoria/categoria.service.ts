import { Injectable } from '@nestjs/common';
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
}
