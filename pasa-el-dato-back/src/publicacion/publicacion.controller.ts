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
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { AlmacenamientoImagenesService } from './almacenamiento-imagenes.service.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { PublicacionCreadaRespuestaDto } from './dto/publicacion-creada-respuesta.dto.js';
import {
  CAMPO_IMAGENES,
  CANTIDAD_MAXIMA_IMAGENES,
  TAMANO_MAXIMO_IMAGEN_BYTES,
  MIMES_IMAGEN_PERMITIDOS,
} from './imagenes.constantes.js';
import { PublicacionService } from './publicacion.service.js';
import { traducirErrorMulter } from './errores-multer.js';
import { asegurarCampoImagenes, type ImagenRecibida } from './validar-imagenes.js';

// Los archivos de multer con memoryStorage tienen la misma forma que
// ImagenRecibida pero son tipados por la plataforma como Express.Multer.File.
// Se usa conversión explícita de tipo para evitar dependencia de @types/multer.
function toImagenesRecibidas(archivos: unknown[]): ImagenRecibida[] {
  return archivos as ImagenRecibida[];
}

@ApiTags('Publicaciones')
@Controller('publicaciones')
export class PublicacionController {
  constructor(
    private readonly publicacionService: PublicacionService,
    private readonly almacenamientoImagenesService: AlmacenamientoImagenesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor(CAMPO_IMAGENES, CANTIDAD_MAXIMA_IMAGENES, {
      storage: undefined, // memoryStorage por defecto: buffers en memoria
      limits: { fileSize: TAMANO_MAXIMO_IMAGEN_BYTES },
      fileFilter: (
        _req: unknown,
        file: unknown,
        cb: (err: Error | null, acceptFile: boolean) => void,
      ) => {
        const f = file as { mimetype: string; originalname: string };
        if (
          MIMES_IMAGEN_PERMITIDOS.includes(
            f.mimetype as (typeof MIMES_IMAGEN_PERMITIDOS)[number],
          )
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Formato de imagen no permitido: ${f.originalname}`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Crear publicación con imágenes' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'titulo',
        'descripcion',
        'precio',
        'sedeId',
        'tipoVentaId',
        'categoriaId',
        'imagenes',
      ],
      properties: {
        titulo: {
          type: 'string',
          minLength: 5,
          maxLength: 100,
          example: 'Notebook Lenovo ThinkPad',
        },
        descripcion: {
          type: 'string',
          minLength: 20,
          maxLength: 2000,
          example: 'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
        },
        precio: {
          type: 'string',
          example: '150000',
          description: 'Entero en CLP enviado como texto en multipart/form-data',
        },
        sedeId: {
          type: 'string',
          example: '1',
          description: 'Identificador de sede enviado como texto en multipart/form-data',
        },
        tipoVentaId: {
          type: 'string',
          example: '1',
          description:
            'Identificador de tipo de venta enviado como texto en multipart/form-data',
        },
        categoriaId: {
          type: 'string',
          example: '1',
          description:
            'Identificador de categoría enviado como texto en multipart/form-data',
        },
        imagenes: {
          type: 'array',
          minItems: 1,
          maxItems: 5,
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiCookieAuth('accessToken')
  @ApiCreatedResponse({ type: PublicacionCreadaRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida' })
  async crear(
    @Req() solicitud: Request & { user?: SesionAutenticada; files?: unknown[] },
    @Body() dto: CrearPublicacionDto,
  ): Promise<PublicacionCreadaRespuestaDto> {
    // El guard garantiza que user existe; el check explícito evita el tipo nullable.
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // FilesInterceptor coloca los archivos en request.files.
    // Traducir errores de multer que hayan pasado hasta aquí.
    const archivosRaw = solicitud.files ?? [];
    const archivos = toImagenesRecibidas(Array.isArray(archivosRaw) ? archivosRaw : []);

    // Verifica que el campo sea exactamente CAMPO_IMAGENES.
    try {
      asegurarCampoImagenes(archivos);
    } catch (err: unknown) {
      throw traducirErrorMulter(err) as Error;
    }

    return this.publicacionService.crearPublicacion(
      dto,
      archivos,
      user.idCuenta,
      this.almacenamientoImagenesService,
    );
  }
}
