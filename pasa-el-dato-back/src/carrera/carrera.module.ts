import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CarreraController } from './carrera.controller.js';
import { CarreraService } from './carrera.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CarreraController],
  providers: [CarreraService],
})
export class CarreraModule {}
