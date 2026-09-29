import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EscuelaController } from './escuela.controller.js';
import { EscuelaService } from './escuela.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [EscuelaController],
  providers: [EscuelaService],
})
export class EscuelaModule {}
