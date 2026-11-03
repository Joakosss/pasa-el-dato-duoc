import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TipoVentaRespuestaDto } from './dto/tipo-venta-respuesta.dto.js';

@Injectable()
export class TipoVentaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<TipoVentaRespuestaDto[]> {
    return this.prisma.tipoVenta.findMany({
      select: { id: true, nombre: true },
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  }

  async obtenerPorId(id: number): Promise<TipoVentaRespuestaDto> {
    const tipoVenta = await this.prisma.tipoVenta.findUnique({
      where: { id },
      select: { id: true, nombre: true },
    });

    if (!tipoVenta) {
      throw new NotFoundException('Tipo de venta no encontrado');
    }

    return tipoVenta;
  }
}
