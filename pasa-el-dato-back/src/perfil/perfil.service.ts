import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { PerfilRespuestaDto } from './dto/perfil-respuesta.dto.js';
import { ReputacionRespuestaDto } from './dto/reputacion-respuesta.dto.js';
import {
  ListarCalificacionesRespuestaDto,
} from './dto/listar-calificaciones-respuesta.dto.js';

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerPerfil(idCuenta: string): Promise<PerfilRespuestaDto> {
    const usuario = await this.buscarPerfilPorCuenta(idCuenta);

    return this.mapearPerfil(usuario);
  }

  async obtenerReputacion(
    idCuenta: string,
  ): Promise<ReputacionRespuestaDto> {
    await this.validarPerfilConsultable(idCuenta);

    const agregacion = await this.prisma.calificacion.aggregate({
      where: { fk_receptor: idCuenta },
      _avg: { puntaje: true },
      _count: { _all: true },
    });

    return {
      usuarioId: idCuenta,
      promedio: agregacion._count._all === 0 ? null : agregacion._avg.puntaje,
      total: agregacion._count._all,
    };
  }

  async listarCalificaciones(
    idCuenta: string,
    page: number,
    pageSize: number,
  ): Promise<ListarCalificacionesRespuestaDto> {
    await this.validarPerfilConsultable(idCuenta);

    const skip = (page - 1) * pageSize;
    const where = { fk_receptor: idCuenta };

    const [total, calificaciones] = await Promise.all([
      this.prisma.calificacion.count({ where }),
      this.prisma.calificacion.findMany({
        where,
        orderBy: [{ fechaCreacion: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
        select: {
          id: true,
          puntaje: true,
          comentario: true,
          fechaCreacion: true,
          fk_publicacion: true,
        },
      }),
    ]);

    return {
      items: calificaciones.map((calificacion) => ({
        id: calificacion.id,
        puntaje: calificacion.puntaje,
        comentario: calificacion.comentario,
        fechaCreacion: calificacion.fechaCreacion.toISOString(),
        publicacionId: calificacion.fk_publicacion,
      })),
      page,
      pageSize,
      total,
      nextPage: skip + calificaciones.length < total ? page + 1 : null,
    };
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

    const tieneCamposActualizables =
      dto.pNombre !== undefined ||
      dto.sNombre !== undefined ||
      dto.pApellido !== undefined ||
      dto.sApellido !== undefined ||
      dto.telefono !== undefined ||
      dto.sedeId !== undefined;

    if (!tieneCamposActualizables) {
      throw new BadRequestException(
        'Debe enviar al menos un campo para actualizar',
      );
    }

    const datosUsuario: {
      pNombre?: string;
      sNombre?: string | null;
      pApellido?: string;
      sApellido?: string;
      fk_sede?: number;
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

    if (dto.sedeId !== undefined) {
      const sede = await this.prisma.sede.findFirst({
        where: {
          id: dto.sedeId,
          activa: true,
          eliminado: false,
        },
        select: { id: true },
      });

      if (sede === null) {
        throw new BadRequestException('La sede indicada no es válida');
      }

      datosUsuario.fk_sede = dto.sedeId;
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

  private async validarPerfilConsultable(idCuenta: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_cuenta: idCuenta },
      select: { id_cuenta: true },
    });

    if (usuario === null) {
      throw new NotFoundException('Perfil no encontrado');
    }
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
