import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PerfilController } from './perfil.controller.js';
import { PerfilService } from './perfil.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PerfilController],
  providers: [PerfilService],
})
export class PerfilModule {}
