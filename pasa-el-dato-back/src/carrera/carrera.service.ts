import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CarreraRespuestaDto } from './dto/carrera-respuesta.dto.js';

@Injectable()
export class CarreraService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(escuelaId?: number): Promise<CarreraRespuestaDto[]> {
    return this.prisma.carrera.findMany({
      // Sin escuelaId se listan todas; con escuelaId se limita la consulta.
      where: escuelaId === undefined ? {} : { fk_escuela: escuelaId },
      select: {
        id: true,
        nombre: true,
        escuela: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [
        { nombre: 'asc' },
        // Hace predecible el orden si existen carreras con el mismo nombre.
        { id: 'asc' },
      ],
    });
  }
}
