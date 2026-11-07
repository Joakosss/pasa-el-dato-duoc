import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PublicacionModule } from '../publicacion/publicacion.module.js';
import { PublicidadController } from './publicidad.controller.js';
import { PublicidadService } from './publicidad.service.js';

@Module({
  imports: [PrismaModule, AuthModule, PublicacionModule],
  controllers: [PublicidadController],
  providers: [PublicidadService],
})
export class PublicidadModule {}
