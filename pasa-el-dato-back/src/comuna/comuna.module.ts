import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CiudadModule } from '../ciudad/ciudad.module.js';
import { ComunaController } from './comuna.controller.js';
import { ComunaService } from './comuna.service.js';

@Module({
  imports: [PrismaModule, CiudadModule],
  controllers: [ComunaController],
  providers: [ComunaService],
  // La exporta SedeModule para validar la comuna del filtro de sedes.
  exports: [ComunaService],
})
export class ComunaModule {}
