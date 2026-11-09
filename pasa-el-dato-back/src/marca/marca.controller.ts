import {
  Body,
  Controller,
  HttpCode,
  UnauthorizedException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthLogInterceptor } from '../auth/auth-log.interceptor.js';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CrearMarcaDto } from './dto/crear-marca.dto.js';
import { MarcaService, type MarcaCreada } from './marca.service.js';

@ApiTags('Administración de marcas')
@Controller('admin/marcas')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
export class MarcaController {
  constructor(private readonly marcaService: MarcaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('Administrador')
  @ApiOperation({
    summary: 'Crear una cuenta de marca autorizada',
    description:
      'Crea de forma atómica una cuenta activa y autorizada con rol Marca. La contraseña inicial no se devuelve.',
  })
  @ApiCreatedResponse({
    description: 'Cuenta de marca creada y autorizada.',
  })
  @ApiBadRequestResponse({
    description: 'Uno o más campos son inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'No existe una sesión válida.',
  })
  @ApiForbiddenResponse({
    description: 'La sesión no corresponde a un administrador.',
  })
  @ApiConflictResponse({
    description: 'El correo ya está registrado.',
  })
  async crear(
    @Body() datos: CrearMarcaDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<MarcaCreada> {
    const user = solicitud.user;
    if (!user) {
      // El guard normalmente impide llegar aquí; mantiene el contrato defensivo.
      throw new UnauthorizedException('Sesión inválida');
    }

    respuesta.locals.authCuentaId = user.idCuenta;
    return this.marcaService.crear(datos, user.idCuenta);
  }
}
