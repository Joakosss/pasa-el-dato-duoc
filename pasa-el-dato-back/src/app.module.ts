import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RolUsuarioModule } from './rol-usuario/rol-usuario.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [RolUsuarioModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
