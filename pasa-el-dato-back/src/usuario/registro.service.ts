import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RegistroService {
  constructor(private readonly prisma: PrismaService) {}

  async existeCorreo(correo: string): Promise<boolean> {
    // Busca la cuenta por su correo único.
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { correo },
      select: { id_cuenta: true },
    });

    // Si no existe, Prisma devuelve null.
    return cuenta !== null;
  }

  async existeRun(run: string): Promise<boolean> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { run },
      select: { id_cuenta: true },
    });
    return usuario !== null;
  }
}

