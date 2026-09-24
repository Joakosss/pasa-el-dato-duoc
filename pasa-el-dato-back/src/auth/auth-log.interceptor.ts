import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { from, Observable, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(contexto: ExecutionContext, siguiente: CallHandler): Observable<unknown> {
    const http = contexto.switchToHttp();
    const solicitud = http.getRequest<Request>();
    const respuesta = http.getResponse<Response>();

    return siguiente.handle().pipe(
      mergeMap(async (resultado: unknown) => {
        // Esperamos el INSERT antes de completar una petición exitosa.
        await this.registrar(solicitud, respuesta, respuesta.statusCode, null);
        return resultado;
      }),
      catchError((error: unknown) => {
        const codigo = error instanceof HttpException ? error.getStatus() : 500;
        // Los errores inesperados no se guardan textualmente: podrían
        // contener detalles internos. Nunca registramos body ni cookies.
        const mensaje = error instanceof HttpException
          ? error.message
          : 'Error interno';

        return from(this.registrar(solicitud, respuesta, codigo, mensaje)).pipe(
          mergeMap(() => throwError(() => error)),
        );
      }),
    );
  }

  private async registrar(
    solicitud: Request,
    respuesta: Response,
    codigo: number,
    mensaje: string | null,
  ): Promise<void> {
    try {
      await this.prisma.log_api.create({
        data: {
          metodo: solicitud.method,
          ruta: solicitud.originalUrl.split('?')[0],
          codigo_estado: codigo,
          mensaje_error: mensaje,
          fk_cuenta:
            typeof respuesta.locals.authCuentaId === 'string'
              ? respuesta.locals.authCuentaId
              : null,
        },
      });
    } catch (error) {
      // Una falla del log no debe convertir un 401/403 en otro error
      // ni deshacer un inicio de sesión que ya fue exitoso.
      this.logger.error('No se pudo registrar la petición de autenticación', error);
    }
  }
}
