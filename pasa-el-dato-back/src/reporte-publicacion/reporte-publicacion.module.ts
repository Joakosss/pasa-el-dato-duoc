import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ReportePublicacionAdminController } from './reporte-publicacion-admin.controller.js';
import { ReportePublicacionService } from './reporte-publicacion.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReportePublicacionAdminController],
  providers: [ReportePublicacionService],
})
export class ReportePublicacionModule {}
