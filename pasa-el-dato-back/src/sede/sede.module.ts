import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ComunaModule } from '../comuna/comuna.module.js';
import { SedeController } from './sede.controller.js';
import { SedeService } from './sede.service.js';

@Module({
  // ComunaModule aporta ComunaService para validar el filtro ?comunaId=.
  imports: [PrismaModule, ComunaModule],
  controllers: [SedeController],
  providers: [SedeService],
})
export class SedeModule {}
