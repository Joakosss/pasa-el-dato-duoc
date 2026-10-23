import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RegionModule } from '../region/region.module.js';
import { CiudadController } from './ciudad.controller.js';
import { CiudadService } from './ciudad.service.js';

@Module({
  imports: [PrismaModule, RegionModule],
  controllers: [CiudadController],
  providers: [CiudadService],
  // La exporta ComunaModule para validar la ciudad del filtro de comunas.
  exports: [CiudadService],
})
export class CiudadModule {}
