import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthLogInterceptor } from './auth-log.interceptor.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secreto = process.env.JWT_ACCESS_SECRET;
        const duracionSegundos = Number(
          process.env.JWT_ACCESS_TTL_SECONDS,
        );

        if (!secreto) {
          throw new Error(
            'Falta la variable de entorno JWT_ACCESS_SECRET',
          );
        }

        if (
          !Number.isInteger(duracionSegundos) ||
          duracionSegundos <= 0
        ) {
          throw new Error(
            'JWT_ACCESS_TTL_SECONDS debe ser un entero positivo',
          );
        }

        return {
          secret: secreto,

          signOptions: {
            expiresIn: duracionSegundos,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthLogInterceptor],
})
export class AuthModule {}
