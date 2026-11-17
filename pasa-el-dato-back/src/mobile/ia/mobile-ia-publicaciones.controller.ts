import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard, type SesionAutenticada } from '../../auth/jwt-auth.guard.js';
import {
  CAMPO_IMAGENES,
  CANTIDAD_MAXIMA_IMAGENES,
  MIMES_IMAGEN_PERMITIDOS,
  TAMANO_MAXIMO_IMAGEN_BYTES,
} from '../../publicacion/imagenes.constantes.js';
import {
  asegurarCampoImagenes,
  type ImagenRecibida,
  validarImagenesRecibidas,
} from '../../publicacion/validar-imagenes.js';
import { GeminiPublicacionesService } from './gemini-publicaciones.service.js';

type SolicitudConArchivos = Request & {
  user?: SesionAutenticada;
  files?: unknown[];
};

interface CuerpoAnalisisPublicacion {
  titulo?: unknown;
  descripcion?: unknown;
  precio?: unknown;
}

function textoRequerido(valor: unknown, campo: string, maximo: number): string {
  if (typeof valor !== 'string') {
    throw new BadRequestException(`${campo} es obligatorio.`);
  }

  const texto = valor.trim();
  if (!texto) {
    throw new BadRequestException(`${campo} es obligatorio.`);
  }

  if (texto.length > maximo) {
    throw new BadRequestException(`${campo} excede el máximo permitido.`);
  }

  return texto;
}

function imagenesRecibidas(archivos: unknown[]): ImagenRecibida[] {
  return archivos as ImagenRecibida[];
}

@Controller('mobile/ia/publicaciones')
export class MobileIaPublicacionesController {
  private readonly logger = new Logger(MobileIaPublicacionesController.name);

  constructor(private readonly geminiPublicacionesService: GeminiPublicacionesService) {}

  @Post('analizar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor(CAMPO_IMAGENES, CANTIDAD_MAXIMA_IMAGENES, {
      storage: undefined,
      limits: { fileSize: TAMANO_MAXIMO_IMAGEN_BYTES },
      fileFilter: (
        _solicitud: unknown,
        archivo: unknown,
        callback: (error: Error | null, aceptarArchivo: boolean) => void,
      ) => {
        const imagen = archivo as { mimetype: string; originalname: string };
        if (
          MIMES_IMAGEN_PERMITIDOS.includes(
            imagen.mimetype as (typeof MIMES_IMAGEN_PERMITIDOS)[number],
          )
        ) {
          callback(null, true);
          return;
        }

        callback(
          new BadRequestException(`Formato de imagen no permitido: ${imagen.originalname}`),
          false,
        );
      },
    }),
  )
  async analizar(
    @Req() solicitud: SolicitudConArchivos,
    @Body() cuerpo: CuerpoAnalisisPublicacion,
  ) {
    if (!solicitud.user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const titulo = textoRequerido(cuerpo.titulo, 'El título', 100);
    const descripcion = textoRequerido(cuerpo.descripcion, 'La descripción', 2000);
    const precio =
      typeof cuerpo.precio === 'string' && cuerpo.precio.trim()
        ? cuerpo.precio.trim().slice(0, 30)
        : undefined;
    const archivos = imagenesRecibidas(
      Array.isArray(solicitud.files) ? solicitud.files : [],
    );
    this.logger.log(`Análisis IA recibido: precio ${precio ? 'presente' : 'ausente'}.`);

    if (archivos.length > 0) {
      asegurarCampoImagenes(archivos);
      validarImagenesRecibidas(archivos);
    }

    return this.geminiPublicacionesService.analizarPublicacion({
      titulo,
      descripcion,
      precio,
      imagenes: archivos.map((imagen) => ({
        buffer: imagen.buffer,
        mimeType: imagen.mimetype,
      })),
    });
  }
}
