import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, type SesionAutenticada } from '../../auth/jwt-auth.guard.js';
import { MobilePublicidadService } from './mobile-publicidad.service.js';

@Controller('mobile/publicidad')
@UseGuards(JwtAuthGuard)
export class MobilePublicidadController {
  constructor(private readonly publicidad: MobilePublicidadService) {}

  @Get('activos')
  listar(@Req() solicitud: Request & { user: SesionAutenticada }) {
    return this.publicidad.listar(solicitud.user.idCuenta);
  }
}
