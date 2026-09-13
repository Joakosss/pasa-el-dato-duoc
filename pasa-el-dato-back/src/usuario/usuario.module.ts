import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsuarioService } from './usuario.service.js';
import { UsuarioController } from './usuario.controller.js';
import { RegistroService } from './registro.service.js';

@Module({
  imports: [PrismaModule],
  providers: [UsuarioService, RegistroService],
  controllers: [UsuarioController]
})
export class UsuarioModule {}
