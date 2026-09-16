import { Module } from '@nestjs/common';
import { RolUsuarioService } from './rol-usuario.service.js';

@Module({
  providers: [RolUsuarioService]
})
export class RolUsuarioModule {}
