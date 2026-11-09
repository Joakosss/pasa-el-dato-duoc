import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PalabrasBloqueadasAdminController } from './palabras-bloqueadas-admin.controller.js';
import { PalabrasBloqueadasService } from './palabras-bloqueadas.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PalabrasBloqueadasAdminController],
  providers: [PalabrasBloqueadasService],
  exports: [PalabrasBloqueadasService],
})
export class PalabrasBloqueadasModule {}
