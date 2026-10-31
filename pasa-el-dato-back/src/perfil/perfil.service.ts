import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { PerfilRespuestaDto } from './dto/perfil-respuesta.dto.js';

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPerfil(idCuenta: string): Promise<PerfilRespuestaDto> {
    const usuario = await this.buscarPerfilPorCuenta(idCuenta);

    return this.mapearPerfil(usuario);
  }

  async actualizarPerfil(
    idCuenta: string,
    dto: ActualizarPerfilDto,
  ): Promise<PerfilRespuestaDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_cuenta: idCuenta },
      select: { id_cuenta: true },
    });

    if (usuario === null) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const datosUsuario: {
      pNombre?: string;
      sNombre?: string | null;
      pApellido?: string;
      sApellido?: string;
    } = {};
    const datosCuenta: {
      telefono?: string;
    } = {};

    if (dto.pNombre !== undefined) {
      datosUsuario.pNombre = dto.pNombre;
    }

    if (dto.sNombre !== undefined) {
      datosUsuario.sNombre = dto.sNombre;
    }

    if (dto.pApellido !== undefined) {
      datosUsuario.pApellido = dto.pApellido;
    }

    if (dto.sApellido !== undefined) {
      datosUsuario.sApellido = dto.sApellido;
    }

    if (dto.telefono !== undefined) {
      datosCuenta.telefono = dto.telefono;
    }

    if (Object.keys(datosUsuario).length > 0) {
      await this.prisma.usuario.update({
        where: { id_cuenta: idCuenta },
        data: datosUsuario,
      });
    }

    if (Object.keys(datosCuenta).length > 0) {
      await this.prisma.cuenta.update({
        where: { id_cuenta: idCuenta },
        data: datosCuenta,
      });
    }

    return this.obtenerPerfil(idCuenta);
  }

  private async buscarPerfilPorCuenta(idCuenta: string) {
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

    return usuario;
  }

  private mapearPerfil(usuario: {
    run: string;
    pNombre: string;
    sNombre: string | null;
    pApellido: string;
    sApellido: string;
    cuenta: {
      correo: string;
      telefono: string;
    };
    sede: {
      nombre: string;
    };
    carrera: {
      nombre: string;
    };
    rol_usuario: {
      descripcion: string;
    };
  }): PerfilRespuestaDto {
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
