import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CuentaService {
  constructor(private readonly prisma: PrismaService) {}

  private async revocarSesiones(
    tx: Pick<PrismaService, 'refreshToken' | 'accessTokenRevocado'>,
    entrada: {
      idCuenta: string;
      ahora: Date;
      accessJti?: string;
      accessExp?: number;
    },
  ): Promise<void> {
    await tx.refreshToken.updateMany({
      where: {
        fk_cuenta: entrada.idCuenta,
        fechaRevocacion: null,
        fechaExpiracion: { gt: entrada.ahora },
      },
      data: { fechaRevocacion: entrada.ahora },
    });

    if (typeof entrada.accessJti === 'string' && entrada.accessJti) {
      let fechaExpiracion: Date;
      if (
        typeof entrada.accessExp === 'number' &&
        Number.isFinite(entrada.accessExp) &&
        entrada.accessExp > 0
      ) {
        fechaExpiracion = new Date(entrada.accessExp * 1000);
      } else {
        const ttl = Number(process.env.JWT_ACCESS_TTL_SECONDS);
        fechaExpiracion =
          Number.isInteger(ttl) && ttl > 0
            ? new Date(entrada.ahora.getTime() + ttl * 1000)
            : entrada.ahora;
      }

      await tx.accessTokenRevocado.upsert({
        where: { jti: entrada.accessJti },
        update: {},
        create: {
          jti: entrada.accessJti,
          fk_cuenta: entrada.idCuenta,
          fechaExpiracion,
        },
      });
    }
  }

  /**
   * Desactivación MVP (reversible): usa Cuenta.aprobada=false.
   * No borra físicamente información.
   *
   * Es idempotente: si ya está desactivada, no falla.
   */
  async desactivarCuentaPropia(entrada: {
    idCuenta: string;
    accessJti?: string;
    accessExp?: number;
  }): Promise<void> {
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: entrada.idCuenta },
      select: {
        id_cuenta: true,
        aprobada: true,
      },
    });

    if (!cuenta) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const ahora = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (cuenta.aprobada) {
        await tx.cuenta.update({
          where: { id_cuenta: cuenta.id_cuenta },
          data: {
            aprobada: false,
            fechaModificacion: ahora,
          },
        });
      }

      await this.revocarSesiones(tx, {
        idCuenta: cuenta.id_cuenta,
        ahora,
        accessJti: entrada.accessJti,
        accessExp: entrada.accessExp,
      });
    });
  }

  /**
   * Eliminación lógica (cierre definitivo): usa Cuenta.eliminado=true.
   * No borra físicamente información.
   *
   * Es idempotente: si ya está eliminada lógicamente, no falla.
   */
  async eliminarCuentaPropia(entrada: {
    idCuenta: string;
    accessJti?: string;
    accessExp?: number;
  }): Promise<void> {
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { id_cuenta: entrada.idCuenta },
      select: {
        id_cuenta: true,
        eliminado: true,
      },
    });

    if (!cuenta) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const ahora = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (!cuenta.eliminado) {
        await tx.cuenta.update({
          where: { id_cuenta: cuenta.id_cuenta },
          data: {
            eliminado: true,
            // Opcional: también dejarla inactiva para consistencia.
            aprobada: false,
            fechaModificacion: ahora,
          },
        });
      }

      await this.revocarSesiones(tx, {
        idCuenta: cuenta.id_cuenta,
        ahora,
        accessJti: entrada.accessJti,
        accessExp: entrada.accessExp,
      });
    });
  }
}
