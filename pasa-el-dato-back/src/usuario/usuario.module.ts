import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service.js';
import { UsuarioController } from './usuario.controller.js';

@Module({
  providers: [UsuarioService],
  controllers: [UsuarioController]
})
export class UsuarioModule {}
