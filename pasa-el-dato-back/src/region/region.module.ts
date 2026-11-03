import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RegionController } from './region.controller.js';
import { RegionService } from './region.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RegionController],
  providers: [RegionService],
  // La exporta CiudadModule para validar la región del filtro de ciudades.
  exports: [RegionService],
})
export class RegionModule {}
