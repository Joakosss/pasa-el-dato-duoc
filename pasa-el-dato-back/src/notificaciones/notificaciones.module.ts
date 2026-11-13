import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificacionesController } from './notificaciones.controller.js';
import { EmailNotificacionesMock } from './email-notificaciones.mock.js';
import { EMAIL_NOTIFICACIONES_PORT } from './email-notificaciones.port.js';
import { NotificacionesService } from './notificaciones.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    EmailNotificacionesMock,
    {
      provide: EMAIL_NOTIFICACIONES_PORT,
      useExisting: EmailNotificacionesMock,
    },
  ],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
