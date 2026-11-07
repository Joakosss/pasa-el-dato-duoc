import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PublicacionModule } from '../publicacion/publicacion.module.js';
import { PublicidadAdminController } from './publicidad-admin.controller.js';
import { PublicidadController } from './publicidad.controller.js';
import { PublicidadService } from './publicidad.service.js';

@Module({
  imports: [PrismaModule, AuthModule, PublicacionModule],
  controllers: [PublicidadController, PublicidadAdminController],
  providers: [PublicidadService],
})
export class PublicidadModule {}
