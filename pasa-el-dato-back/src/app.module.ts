import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RolUsuarioModule } from './rol-usuario/rol-usuario.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsuarioModule } from './usuario/usuario.module.js';

@Module({
  imports: [RolUsuarioModule, PrismaModule, UsuarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
