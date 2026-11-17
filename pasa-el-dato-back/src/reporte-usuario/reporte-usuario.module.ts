import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ReporteUsuarioAdminController } from './reporte-usuario-admin.controller.js';
import { ReporteUsuarioController } from './reporte-usuario.controller.js';
import { ReporteUsuarioService } from './reporte-usuario.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReporteUsuarioAdminController, ReporteUsuarioController],
  providers: [ReporteUsuarioService],
})
export class ReporteUsuarioModule {}
