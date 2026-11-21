import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';

import { JwtAuthGuard, type SesionAutenticada } from '../../auth/jwt-auth.guard.js';
import { MobileConsentimientoService } from './mobile-consentimiento.service.js';

class AutorizarTextoDto {
  @IsBoolean()
  @IsIn([true])
  confirmado!: boolean;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  titulo!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  descripcion!: string;
}

type SolicitudAutenticada = Request & { user: SesionAutenticada };

@Controller('mobile/ia/publicaciones/:id/consentimiento')
@UseGuards(JwtAuthGuard)
export class MobileConsentimientoController {
  constructor(private readonly consentimiento: MobileConsentimientoService) {}

  @Get()
  estado(@Param('id', ParseUUIDPipe) id: string, @Req() req: SolicitudAutenticada) {
    return this.consentimiento.estado(id, req.user.idCuenta);
  }

  @Post()
  autorizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: SolicitudAutenticada,
    @Body() dto: AutorizarTextoDto,
  ) {
    return this.consentimiento.autorizar(id, req.user.idCuenta, dto.titulo, dto.descripcion);
  }

  @Delete()
  retirar(@Param('id', ParseUUIDPipe) id: string, @Req() req: SolicitudAutenticada) {
    return this.consentimiento.retirar(id, req.user.idCuenta);
  }
}
