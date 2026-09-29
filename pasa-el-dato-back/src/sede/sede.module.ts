import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SedeController } from './sede.controller.js';
import { SedeService } from './sede.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [SedeController],
  providers: [SedeService],
})
export class SedeModule {}
