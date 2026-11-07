import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { ChatService } from './chat.service.js';
import { ConversacionCreadaRespuestaDto } from './dto/conversacion-creada-respuesta.dto.js';
import { IniciarConversacionDto } from './dto/iniciar-conversacion.dto.js';
import { ListaConversacionesRespuestaDto } from './dto/lista-conversaciones-respuesta.dto.js';
import { MarcarConversacionLeidaRespuestaDto } from './dto/marcar-conversacion-leida-respuesta.dto.js';
import { ListaMensajesRespuestaDto } from './dto/lista-mensajes-respuesta.dto.js';
import { ListarConversacionesQueryDto } from './dto/listar-conversaciones-query.dto.js';
import { ListarMensajesQueryDto } from './dto/listar-mensajes-query.dto.js';
import { MensajeRespuestaDto } from './dto/mensaje-respuesta.dto.js';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Iniciar conversación desde una publicación',
    description:
      'Crea o recupera una conversación única por publicación y par de usuarios.',
  })
  @ApiCookieAuth('accessToken')
  @ApiCookieAuth('refreshToken')
  @ApiCreatedResponse({ type: ConversacionCreadaRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @Post('conversaciones')
  async iniciarConversacion(
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Body() dto: IniciarConversacionDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<ConversacionCreadaRespuestaDto> {
    const user = solicitud.user!;

    const resultado = await this.chatService.iniciarConversacion({
      publicacionId: dto.publicacionId,
      idCuentaSolicitante: user.idCuenta,
    });

    // Auditoría log_api
    respuesta.locals.authCuentaId = user.idCuenta;

    return resultado;
  }

  @Get('conversaciones')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Listar conversaciones del usuario autenticado',
    description:
      'Devuelve conversaciones ordenadas por actividad reciente. Paginado por cursor.',
  })
  @ApiCookieAuth('accessToken')
  @ApiCookieAuth('refreshToken')
  @ApiOkResponse({ type: ListaConversacionesRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  async listarConversaciones(
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Query() query: ListarConversacionesQueryDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<ListaConversacionesRespuestaDto> {
    const user = solicitud.user!;
    const limit = query.limit ?? 20;

    const resultado = await this.chatService.listarConversacionesPaginadas({
      cuentaId: user.idCuenta,
      cursor: query.cursor,
      limit,
    });

    respuesta.locals.authCuentaId = user.idCuenta;

    return {
      items: resultado.items.map((item) => ({
        conversacionId: item.conversacionId,
        contraparteCuentaId: item.contraparteCuentaId,
        estadoPublicacionAlCrear: item.estadoPublicacionAlCrear,
        publicacion: item.publicacion,
        ultimoMensaje: item.ultimoMensaje ?? undefined,
        noLeidosCount: item.noLeidosCount,
        actividadEn: item.actividadEn,
      })),
      nextCursor: resultado.nextCursor,
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Marcar conversación como leída',
    description:
      'Marca como leídos, de forma idempotente, los mensajes de la contraparte al abrir la conversación.',
  })
  @ApiCookieAuth('accessToken')
  @ApiCookieAuth('refreshToken')
  @ApiParam({ name: 'id', description: 'ID de la conversación (ObjectId).' })
  @ApiOkResponse({ type: MarcarConversacionLeidaRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @Post('conversaciones/:id/leer')
  async marcarConversacionComoLeida(
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Param('id') conversacionId: string,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<MarcarConversacionLeidaRespuestaDto> {
    const user = solicitud.user!;

    const resultado = await this.chatService.marcarConversacionComoLeida({
      conversacionId,
      cuentaId: user.idCuenta,
    });

    respuesta.locals.authCuentaId = user.idCuenta;

    return resultado;
  }

  @Get('conversaciones/:id/mensajes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Listar mensajes paginados de una conversación',
    description:
      'Devuelve mensajes desde el más reciente hacia atrás. Solo participantes.',
  })
  @ApiCookieAuth('accessToken')
  @ApiCookieAuth('refreshToken')
  @ApiParam({ name: 'id', description: 'ID de la conversación (ObjectId).' })
  @ApiOkResponse({ type: ListaMensajesRespuestaDto })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  async listarMensajes(
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Param('id') conversacionId: string,
    @Query() query: ListarMensajesQueryDto,
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<ListaMensajesRespuestaDto> {
    const user = solicitud.user!;

    const limit = query.limit ?? 20;

    const resultado = await this.chatService.listarMensajesPaginados({
      conversacionId,
      cuentaId: user.idCuenta,
      cursor: query.cursor,
      limit,
    });

    respuesta.locals.authCuentaId = user.idCuenta;

    return {
      items: resultado.items.map((doc) => {
        const dto = new MensajeRespuestaDto();
        dto.id = String(doc._id);
        dto.conversacionId = String(doc.conversacionId);
        dto.emisorCuentaId = doc.emisorCuentaId;
        dto.texto = doc.texto;
        dto.enviadoEn = doc.enviadoEn;
        dto.leido = doc.leido;
        dto.leidoPorContraparte = doc.leidoPorContraparte;
        return dto;
      }),
      nextCursor: resultado.nextCursor,
    };
  }
}
