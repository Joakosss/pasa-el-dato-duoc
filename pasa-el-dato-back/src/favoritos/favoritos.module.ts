import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FavoritosController } from './favoritos.controller.js';
import { FavoritosService } from './favoritos.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [FavoritosService],
  controllers: [FavoritosController],
})
export class FavoritosModule {}
