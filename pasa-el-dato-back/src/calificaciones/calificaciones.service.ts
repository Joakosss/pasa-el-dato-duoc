import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EstadoCalificacionRespuestaDto } from './dto/estado-calificacion-respuesta.dto.js';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto.js';

type CrearCalificacionParams = {
  publicacionId: string;
  sesion: { idCuenta: string } | undefined;
  dto: CrearCalificacionDto;
};

type ConsultarEstadoCalificacionParams = {
  publicacionId: string;
  sesion: { idCuenta: string } | undefined;
};

type PublicacionCalificable = {
  id: string;
  eliminado: boolean;
  fk_usuario: string;
  fk_user_comprador: string | null;
  calificacion_activada: boolean;
  estadoPublicacion: { descripcion: string };
};

type DireccionCalificacion = {
  esVendedor: boolean;
  receptorId: string | null;
};

@Injectable()
export class CalificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  // Carga la publicación validando existencia y no eliminación (404).
  private async cargarPublicacionCalificable(
    publicacionId: string,
  ): Promise<PublicacionCalificable> {
    const publicacion = await this.prisma.publicacion.findUnique({
      where: { id: publicacionId },
      select: {
        id: true,
        eliminado: true,
        fk_usuario: true,
        fk_user_comprador: true,
        calificacion_activada: true,
        estadoPublicacion: { select: { descripcion: true } },
      },
    });

    if (!publicacion || publicacion.eliminado) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return publicacion;
  }

  // Resuelve la contraparte según la dirección del usuario autenticado (403 si no participa).
  private resolverContraparte(
    idCuenta: string,
    publicacion: PublicacionCalificable,
  ): DireccionCalificacion {
    const esVendedor = idCuenta === publicacion.fk_usuario;
    const esComprador = idCuenta === publicacion.fk_user_comprador;

    if (!esVendedor && !esComprador) {
      throw new ForbiddenException('No participa en esta transacción');
    }

    const receptorId = esVendedor
      ? publicacion.fk_user_comprador
      : publicacion.fk_usuario;

    return { esVendedor, receptorId };
  }

  async crear(params: CrearCalificacionParams): Promise<{
    id: string;
    fk_publicacion: string;
    fk_emisor: string;
    fk_receptor: string;
    puntaje: number;
    comentario: string | null;
    fechaCreacion: Date;
  }> {
    const { publicacionId, sesion, dto } = params;

    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const publicacion =
      await this.cargarPublicacionCalificable(publicacionId);

    // Precondición: transacción finalizada = Vendida + comprador registrado
    if (publicacion.estadoPublicacion.descripcion !== 'Vendida') {
      throw new NotFoundException('No hay transacción finalizada para calificar');
    }
    if (!publicacion.fk_user_comprador) {
      throw new NotFoundException('No hay transacción finalizada para calificar');
    }

    // HU-CAL-03: mientras la calificación no esté activada, ningún participante puede calificar.
    if (!publicacion.calificacion_activada) {
      throw new NotFoundException('La calificación aún no está activada');
    }

    const idCuenta = sesion.idCuenta;
    const { receptorId } = this.resolverContraparte(idCuenta, publicacion);

    try {
      return await this.prisma.calificacion.create({
        data: {
          puntaje: dto.puntaje,
          comentario: dto.comentario,
          fk_publicacion: publicacion.id,
          fk_emisor: idCuenta,
          fk_receptor: receptorId as string,
        },
      });
    } catch (err: unknown) {
      // Constraint unique: ux_calificacion_publicacion_emisor_receptor
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Ya existe una calificación en esta dirección');
      }
      throw err as Error;
    }
  }

  // HU-CAL-04: consulta de solo lectura del estado de calificación de una transacción.
  async consultarEstado(
    params: ConsultarEstadoCalificacionParams,
  ): Promise<EstadoCalificacionRespuestaDto> {
    const { publicacionId, sesion } = params;

    if (!sesion) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const publicacion =
      await this.cargarPublicacionCalificable(publicacionId);

    // Precedencia: la participación se valida antes de evaluar los flags.
    const idCuenta = sesion.idCuenta;
    const { receptorId } = this.resolverContraparte(idCuenta, publicacion);

    const transaccionFinalizada =
      publicacion.estadoPublicacion.descripcion === 'Vendida' &&
      publicacion.fk_user_comprador !== null;

    const calificacionActivada = publicacion.calificacion_activada;

    let yaCalifico = false;
    if (receptorId) {
      const existente = await this.prisma.calificacion.findFirst({
        where: {
          fk_publicacion: publicacion.id,
          fk_emisor: idCuenta,
          fk_receptor: receptorId,
        },
        select: { id: true },
      });
      yaCalifico = existente !== null;
    }

    return {
      publicacionId: publicacion.id,
      transaccionFinalizada,
      calificacionActivada,
      yaCalifico,
    };
  }
}
