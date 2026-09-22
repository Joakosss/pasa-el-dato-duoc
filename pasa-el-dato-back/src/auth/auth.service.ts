import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarCuentaPorCorreo(correo: string) {
    // correo es UNIQUE, por eso utilizamos findUnique.
    return this.prisma.cuenta.findUnique({
      where: {
        correo,
      },

      // Se seleccionan solamente los datos necesarios para autenticar
      // y preparar posteriormente la respuesta segura.
      select: {
        id_cuenta: true,
        correo: true,

        // Este campo se necesita internamente para comprobar la contraseña.
        // Nunca debe enviarse al frontend.
        claveHash: true,

        aprobada: true,
        bloqueado: true,

        // Una cuenta puede existir temporalmente sin usuario asociado.
        usuario: {
          select: {
            run: true,
            pNombre: true,
            sNombre: true,
            pApellido: true,
            sApellido: true,

            // El rol se necesitará para el JWT y la autorización futura.
            rol_usuario: {
              select: {
                id: true,
                descripcion: true,
              },
            },
          },
        },
      },
    });
  }
}