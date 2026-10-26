import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PublicacionController } from './publicacion.controller.js';
import { AlmacenamientoImagenesService } from './almacenamiento-imagenes.service.js';
import { PublicacionService } from './publicacion.service.js';

@Module({
  // AuthModule aporta JwtService para JwtAuthGuard (T-06/T-10).
  imports: [PrismaModule, AuthModule],
  controllers: [PublicacionController],
  providers: [PublicacionService, AlmacenamientoImagenesService],
})
export class PublicacionModule {}
