import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto.js';
import { verificarContrasena } from '../common/security/contrasena-hash.js';
import { calcularHashRefreshToken, generarRefreshToken } from './refresh-token.js';

// Datos que puede usar el flujo de autenticación sin exponer el hash.
export interface UsuarioAutenticado {
  idCuenta: string;
  correo: string;
  usuario: {
    run: string;
    pNombre: string;
    sNombre: string | null;
    pApellido: string;
    sApellido: string;
    rol: {
      id: number;
      descripcion: string;
    };
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  async validarCredenciales(
    datos: IniciarSesionDto,
  ): Promise<UsuarioAutenticado> {
    const cuenta = await this.buscarCuentaPorCorreo(datos.correo);

    if (!cuenta) {
      // El cliente recibe el mismo mensaje si falla el correo o la contraseña.
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const contrasenaCorrecta = await verificarContrasena(
      datos.contrasena,
      cuenta.claveHash,
    );

    if (!contrasenaCorrecta) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Solo revelamos el estado de la cuenta después de comprobar la contraseña.
    // Si además no está aprobada, prevalece el bloqueo.
    if (cuenta.bloqueado) {
      throw new ForbiddenException('Cuenta bloqueada');
    }

    if (!cuenta.aprobada) {
      throw new ForbiddenException('Cuenta inactiva');
    }

    // Una CUENTA puede existir durante el registro sin su USUARIO asociado.
    if (cuenta.usuario === null) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Construimos un resultado nuevo para que claveHash no salga del servicio.
    return {
      idCuenta: cuenta.id_cuenta,
      correo: cuenta.correo,
      usuario: {
        run: cuenta.usuario.run,
        pNombre: cuenta.usuario.pNombre,
        sNombre: cuenta.usuario.sNombre,
        pApellido: cuenta.usuario.pApellido,
        sApellido: cuenta.usuario.sApellido,
        rol: {
          id: cuenta.usuario.rol_usuario.id,
          descripcion: cuenta.usuario.rol_usuario.descripcion,
        },
      },
    };
  }

  async generarAccessToken(
    autenticado: UsuarioAutenticado,
  ): Promise<string> {
    // El JWT contiene solo la identidad de la cuenta y su rol.
    // JwtModule ya configuró el secreto y la vigencia desde el entorno.
    return this.jwtService.signAsync({
      sub: autenticado.idCuenta,
      rolId: autenticado.usuario.rol.id,
    });
  }

  async crearRefreshToken(idCuenta: string): Promise<string> {
    const dias = Number(process.env.REFRESH_TOKEN_TTL_DAYS);

    // Una vigencia ausente o inválida no debe crear un token sin expiración útil.
    if (!Number.isInteger(dias) || dias <= 0) {
      throw new Error(
        'REFRESH_TOKEN_TTL_DAYS debe ser un entero positivo',
      );
    }

    const { token, tokenHash } = generarRefreshToken();
    const fechaExpiracion = new Date(
      Date.now() + dias * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        // PostgreSQL guarda solo el hash; el token original irá en una cookie.
        tokenHash,
        fechaExpiracion,
        cuenta: {
          connect: { id_cuenta: idCuenta },
        },
      },
    });

    // El llamador recibirá el token únicamente después de persistir su hash.
    return token;
  }

  async iniciarSesion(datos: IniciarSesionDto,): 
  Promise<{
    usuario: UsuarioAutenticado;
    accessToken: string;
    refreshToken: string;
  }> {
    const usuario = await this.validarCredenciales(datos);
    const accessToken = await this.generarAccessToken(usuario);
    const refreshToken = await this.crearRefreshToken(usuario.idCuenta);

    return { usuario, accessToken, refreshToken };
  }

  async buscarRefreshTokenVigente(
    token: string,
  ): Promise<{ id: string; idCuenta: string } | null> {
    // Buscamos por el hash: el token original solo llega en la cookie.
    const registro = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: calcularHashRefreshToken(token) },
      select: {
        id: true,
        fk_cuenta: true,
        fechaExpiracion: true,
        fechaRevocacion: true,
      },
    });

    // Ninguno de estos casos debe permitir renovar la sesión.
    if (
      !registro ||
      registro.fechaRevocacion !== null ||
      registro.fechaExpiracion <= new Date()
    ) {
      return null;
    }

    return { id: registro.id, idCuenta: registro.fk_cuenta };
  }

  async buscarCuentaParaRenovacion(idCuenta: string) {
    return this.prisma.cuenta.findUnique({
      where: { id_cuenta: idCuenta },
      select: {
        aprobada: true,
        bloqueado: true,
        usuario: {
          select: {
            rol_usuario: {
              select: { id: true },
            },
          },
        },
      },
    });
  }

  async renovarSesion(token: string): Promise<{
    idCuenta: string;
    accessToken: string;
    refreshToken: string;
  }> {
    if (!token) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const registro = await this.buscarRefreshTokenVigente(token);
    if (!registro) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // El rol y el estado se consultan de nuevo: pueden haber cambiado
    // desde que la persona inició sesión.
    const cuenta = await this.buscarCuentaParaRenovacion(registro.idCuenta);
    if (!cuenta || !cuenta.usuario) {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (cuenta.bloqueado) {
      throw new ForbiddenException('Cuenta bloqueada');
    }
    if (!cuenta.aprobada) {
      throw new ForbiddenException('Cuenta inactiva');
    }

    const dias = Number(process.env.REFRESH_TOKEN_TTL_DAYS);
    if (!Number.isInteger(dias) || dias <= 0) {
      throw new Error('REFRESH_TOKEN_TTL_DAYS debe ser un entero positivo');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: registro.idCuenta,
      rolId: cuenta.usuario.rol_usuario.id,
    });
    const nuevo = generarRefreshToken();
    const ahora = new Date();
    const fechaExpiracion = new Date(
      ahora.getTime() + dias * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      // La condición evita que dos peticiones usen el mismo token a la vez.
      const revocados = await tx.refreshToken.updateMany({
        where: {
          id: registro.id,
          fechaRevocacion: null,
          fechaExpiracion: { gt: ahora },
        },
        data: { fechaRevocacion: ahora },
      });
      if (revocados.count !== 1) {
        throw new UnauthorizedException('Sesión inválida');
      }

      // Si falla esta inserción, la transacción deshace también la revocación.
      await tx.refreshToken.create({
        data: {
          tokenHash: nuevo.tokenHash,
          fechaExpiracion,
          cuenta: { connect: { id_cuenta: registro.idCuenta } },
        },
      });
    });

    return {
      idCuenta: registro.idCuenta,
      accessToken,
      refreshToken: nuevo.token,
    };
  }
}
