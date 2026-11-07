import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthLogInterceptor } from '../auth/auth-log.interceptor.js';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import {
  MIMES_IMAGEN_PERMITIDOS,
  TAMANO_MAXIMO_IMAGEN_BYTES,
} from '../publicacion/imagenes.constantes.js';
import { AlmacenamientoImagenesService } from '../publicacion/almacenamiento-imagenes.service.js';
import { CrearBannerPublicidadDto } from './dto/crear-banner-publicidad.dto.js';
import {
  CAMPO_IMAGEN_BANNER,
  validarImagenBanner,
  type ImagenBannerRecibida,
} from './validar-imagen-banner.js';
import {
  PublicidadService,
  type BannerPublicidadCreado,
} from './publicidad.service.js';

@ApiTags('Publicidad')
@Controller('publicidad/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
export class PublicidadController {
  constructor(
    private readonly publicidadService: PublicidadService,
    private readonly almacenamientoImagenesService: AlmacenamientoImagenesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('Marca')
  @UseInterceptors(
    FileInterceptor(CAMPO_IMAGEN_BANNER, {
      storage: undefined,
      limits: { fileSize: TAMANO_MAXIMO_IMAGEN_BYTES },
      fileFilter: (
        _req: unknown,
        file: unknown,
        cb: (err: Error | null, acceptFile: boolean) => void,
      ) => {
        const archivo = file as { mimetype: string; originalname: string };
        if (
          MIMES_IMAGEN_PERMITIDOS.includes(
            archivo.mimetype as (typeof MIMES_IMAGEN_PERMITIDOS)[number],
          )
        ) {
          cb(null, true);
          return;
        }

        cb(
          new BadRequestException(
            `Formato de imagen no permitido: ${archivo.originalname}`,
          ),
          false,
        );
      },
    }),
  )
  @ApiOperation({ summary: 'Crear banner publicitario pendiente de aprobación' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagen', 'mensaje', 'fechaInicio', 'fechaFin', 'sedes'],
      properties: {
        imagen: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG o WebP de máximo 5 MB',
        },
        mensaje: {
          type: 'string',
          example: 'Conoce nuestra nueva colección',
        },
        fechaInicio: {
          type: 'string',
          format: 'date-time',
          example: '2026-12-01T00:00:00.000Z',
        },
        fechaFin: {
          type: 'string',
          format: 'date-time',
          example: '2026-12-31T23:59:59.000Z',
        },
        sedes: {
          type: 'string',
          example: '[1,2]',
          description: 'JSON array o lista separada por comas de IDs de sedes',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Banner creado en estado PENDIENTE',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        imagen: { type: 'string' },
        mensaje: { type: 'string' },
        fechaInicio: { type: 'string', format: 'date-time' },
        fechaFin: { type: 'string', format: 'date-time' },
        estado: { type: 'string', example: 'PENDIENTE' },
        sedes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              nombre: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  @ApiForbiddenResponse({
    description: 'La cuenta no corresponde a una marca autorizada',
  })
  async crear(
    @Req()
    solicitud: Request & {
      user?: SesionAutenticada;
      file?: ImagenBannerRecibida;
    },
    @Body() dto: CrearBannerPublicidadDto,
  ): Promise<BannerPublicidadCreado> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const imagen = validarImagenBanner(solicitud.file);

    return this.publicidadService.crearBanner(
      dto,
      imagen as ImagenBannerRecibida,
      user.idCuenta,
      this.almacenamientoImagenesService,
    );
  }
}
