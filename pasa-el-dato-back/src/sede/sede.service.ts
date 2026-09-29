import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SedeRespuestaDto } from './dto/sede-respuesta.dto.js';

@Injectable()
export class SedeService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<SedeRespuestaDto[]> {
    // Devuelve solo los campos que el frontend necesita para listar sedes.
    return this.prisma.sede.findMany({
      select: {
        id: true,
        nombre: true,
        activa: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
