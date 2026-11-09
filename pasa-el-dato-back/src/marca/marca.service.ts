import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { generarHashContrasena } from '../common/security/contrasena-hash.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearMarcaDto } from './dto/crear-marca.dto.js';

export interface MarcaCreada {
  idCuenta: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: 'Marca';
  aprobada: true;
  bloqueado: false;
}

@Injectable()
export class MarcaService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    datos: CrearMarcaDto,
    idCuentaAdministrador: string,
  ): Promise<MarcaCreada> {
    const rol = await this.prisma.rolUsuario.findUnique({
      where: { descripcion: 'Marca' },
      select: { id: true },
    });

    if (!rol) {
      throw new InternalServerErrorException(
        'El rol Marca no existe en el catálogo',
      );
    }

    const claveHash = await generarHashContrasena(datos.contrasenaInicial);

    try {
      const cuenta = await this.prisma.$transaction(async (tx) => {
        const creada = await tx.cuenta.create({
          data: {
            correo: datos.correo,
            claveHash,
            telefono: datos.telefono,
            aprobada: true,
            bloqueado: false,
            eliminado: false,
            fk_modificado_por: idCuentaAdministrador,
          },
        });

        await tx.marca.create({
          data: {
            id_cuenta: creada.id_cuenta,
            nombre: datos.nombre,
          },
        });

        return creada;
      });

      return {
        idCuenta: cuenta.id_cuenta,
        nombre: datos.nombre,
        correo: cuenta.correo,
        telefono: cuenta.telefono,
        rol: 'Marca',
        aprobada: true,
        bloqueado: false,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El correo ya está registrado');
      }

      throw error;
    }
  }
}
