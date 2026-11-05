import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { Conversation, ConversationSchema } from './schemas/conversation.schema.js';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

@Module({
  imports: [
    PrismaModule,
    // JwtAuthGuard depende de JwtService; lo registramos aquí para evitar
    // asumir que AuthModule exporta JwtModule.
    JwtModule.register({ secret: JWT_ACCESS_SECRET }),
    MongooseModule.forRoot(process.env.MONGO_URL ?? '', {
      // Evita warning en tests con upserts concurrentes.
      autoIndex: true,
    }),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
