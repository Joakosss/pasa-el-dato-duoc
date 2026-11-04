import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CuentaController } from './cuenta.controller.js';
import { CuentaService } from './cuenta.service.js';

// Este módulo solo necesita decodificar tokens (sin verificar firma),
// pero JwtService requiere secret para sign/verify y varios tests e2e lo usan.
// AuthModule configura JwtModule globalmente, pero para evitar dependencias
// circulares, registramos aquí el mismo secret por env.
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [CuentaController],
  providers: [CuentaService],
})
export class CuentaModule {}
