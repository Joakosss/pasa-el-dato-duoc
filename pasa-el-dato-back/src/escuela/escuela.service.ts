import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EscuelaRespuestaDto } from './dto/escuela-respuesta.dto.js';

@Injectable()
export class EscuelaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<EscuelaRespuestaDto[]> {
    return this.prisma.escuela.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
