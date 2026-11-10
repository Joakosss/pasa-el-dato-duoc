import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificacionesModule } from '../notificaciones/notificaciones.module.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { FiltroPalabrasBloqueadasService } from './moderacion/filtro-palabras-bloqueadas.service.js';
import { Conversation, ConversationSchema } from './schemas/conversation.schema.js';
import { Mensaje, MensajeSchema } from './schemas/mensaje.schema.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

@Module({
  imports: [
    PrismaModule,
    NotificacionesModule,
    // JwtAuthGuard depende de JwtService; lo registramos aquí para evitar
    // asumir que AuthModule exporta JwtModule.
    JwtModule.register({ secret: JWT_ACCESS_SECRET }),
    MongooseModule.forRoot(process.env.MONGO_URL ?? '', {
      // Evita warning en tests con upserts concurrentes.
      autoIndex: true,
    }),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Mensaje.name, schema: MensajeSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, FiltroPalabrasBloqueadasService],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
