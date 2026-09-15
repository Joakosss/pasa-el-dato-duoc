import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';
import { generarHashContrasena } from '../common/security/contrasena-hash.js';

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

  async obtenerIdRolEstudiante(): Promise<number | null> {
    const rol = await this.prisma.rolUsuario.findUnique({
      where: { descripcion: 'Estudiante' },
      select: { id: true },
    });

    return rol ? rol.id : null;
  }

  async obtenerSedePorId(
    sedeId: number,
  ): Promise<{ id:number; activa: boolean } | null> {
    return this.prisma.sede.findUnique({
      where: { id: sedeId },
      select: { id: true, activa: true },
    });
  }

  async verificarUnicidad(correo: string, run: string): Promise<void> {
    if (await this.existeCorreo(correo)) {
      throw new ConflictException('El correo ya está registrado');
    }

    if (await this.existeRun(run)) {
      throw new ConflictException('El RUN ya está registrado');
    }
  }

  async validarReferenciasRegistro(sedeId: number): Promise<number> {
    const sede = await this.obtenerSedePorId(sedeId);
    if (sede === null) {
      throw new BadRequestException('La sede no existe');
    }

    const rolId = await this.obtenerIdRolEstudiante();
    if (rolId === null) {
      throw new InternalServerErrorException('El rol Estudiante no existe');
    }
    
    return rolId;
  }

  async registrar(datos: RegistrarUsuarioDto): Promise<void> {
    // Verifica que el correo y el RUN no estén registrados.
    await this.verificarUnicidad(datos.correo, datos.run);

    // Verifica que la sede exista y que el rol Estudiante esté definido.
    const rolId = await this.validarReferenciasRegistro(datos.sedeId);

    // Genera el hash de la contraseña.
    const claveHash = await generarHashContrasena(datos.contrasena);

    await this.prisma.$transaction(async (tx) => {
      // Primero se crea CUENTA y PostgreSQL genera su UUID.
      const cuenta = await tx.cuenta.create({
        data: {
          correo: datos.correo,
          claveHash,
          telefono: datos.telefono,
          estado: 'PENDIENTE',
        },
      });

      // USUARIO se crea dentro de la misma transacción y utiliza ese UUID.
      await tx.usuario.create({
        data: {
          run: datos.run,
          pNombre: datos.pNombre,
          sNombre: datos.sNombre ?? null,
          pApellido: datos.pApellido,
          sApellido: datos.sApellido,
          cuenta: { connect: { id_cuenta: cuenta.id_cuenta } },
          rol_usuario: { connect: { id: rolId } },
          sede: { connect: { id: datos.sedeId } },
        },
      });
    });
  }
}
