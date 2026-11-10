import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CalificacionesController } from './calificaciones.controller.js';
import { CalificacionesService } from './calificaciones.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CalificacionesController],
  providers: [CalificacionesService],
  exports: [CalificacionesService],
})
export class CalificacionesModule {}
