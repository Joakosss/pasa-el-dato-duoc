import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PerfilRespuestaDto } from './dto/perfil-respuesta.dto.js';

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPerfil(idCuenta: string): Promise<PerfilRespuestaDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_cuenta: idCuenta },
      select: {
        run: true,
        pNombre: true,
        sNombre: true,
        pApellido: true,
        sApellido: true,
        cuenta: {
          select: {
            correo: true,
            telefono: true,
          },
        },
        sede: {
          select: {
            nombre: true,
          },
        },
        carrera: {
          select: {
            nombre: true,
          },
        },
        rol_usuario: {
          select: {
            descripcion: true,
          },
        },
      },
    });

    if (usuario === null) {
      throw new UnauthorizedException('Sesión inválida');
    }

    return {
      run: usuario.run,
      pNombre: usuario.pNombre,
      sNombre: usuario.sNombre,
      pApellido: usuario.pApellido,
      sApellido: usuario.sApellido,
      correo: usuario.cuenta.correo,
      telefono: usuario.cuenta.telefono,
      sede: {
        nombre: usuario.sede.nombre,
      },
      carrera: {
        nombre: usuario.carrera.nombre,
      },
      rol: {
        descripcion: usuario.rol_usuario.descripcion,
      },
    };
  }
}
