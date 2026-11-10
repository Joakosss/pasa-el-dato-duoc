import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto.js';

type CrearCalificacionParams = {
  publicacionId: string;
  sesion: { idCuenta: string } | undefined;
  dto: CrearCalificacionDto;
};

@Injectable()
export class CalificacionesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const esVendedor = idCuenta === publicacion.fk_usuario;
    const esComprador = idCuenta === publicacion.fk_user_comprador;

    if (!esVendedor && !esComprador) {
      throw new ForbiddenException('No participa en esta transacción');
    }

    const emisorId = idCuenta;
    const receptorId = esVendedor ? publicacion.fk_user_comprador : publicacion.fk_usuario;

    try {
      return await this.prisma.calificacion.create({
        data: {
          puntaje: dto.puntaje,
          comentario: dto.comentario,
          fk_publicacion: publicacion.id,
          fk_emisor: emisorId,
          fk_receptor: receptorId,
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
}
