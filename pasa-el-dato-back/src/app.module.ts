import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RolUsuarioModule } from './rol-usuario/rol-usuario.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsuarioModule } from './usuario/usuario.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SedeModule } from './sede/sede.module.js';
import { EscuelaModule } from './escuela/escuela.module.js';
import { CarreraModule } from './carrera/carrera.module.js';

@Module({
  imports: [
    RolUsuarioModule,
    PrismaModule,
    UsuarioModule,
    AuthModule,
    SedeModule,
    EscuelaModule,
    CarreraModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
