import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MarcaController } from './marca.controller.js';
import { MarcaService } from './marca.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MarcaController],
  providers: [MarcaService],
})
export class MarcaModule {}
