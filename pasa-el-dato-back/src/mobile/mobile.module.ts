import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MobileAuthController } from './auth/mobile-auth.controller.js';
import { MobileChatController } from './chat/mobile-chat.controller.js';
import { MobileChatService } from './chat/mobile-chat.service.js';
import { MobilePublicacionesController } from './publicaciones/mobile-publicaciones.controller.js';

@Module({
  imports: [AuthModule, ChatModule, PrismaModule],
  controllers: [
    MobileAuthController,
    MobileChatController,
    MobilePublicacionesController,
  ],
  providers: [MobileChatService],
})
export class MobileModule {}
