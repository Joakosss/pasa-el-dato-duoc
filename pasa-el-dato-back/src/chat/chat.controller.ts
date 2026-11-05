import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { ChatService } from './chat.service.js';
import { ConversacionCreadaRespuestaDto } from './dto/conversacion-creada-respuesta.dto.js';
import { IniciarConversacionDto } from './dto/iniciar-conversacion.dto.js';

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
}
