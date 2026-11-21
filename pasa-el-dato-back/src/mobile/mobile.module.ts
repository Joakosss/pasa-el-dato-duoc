import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { Conversation, ConversationSchema } from '../chat/schemas/conversation.schema.js';
import { Mensaje, MensajeSchema } from '../chat/schemas/mensaje.schema.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MobileAuthController } from './auth/mobile-auth.controller.js';
import { GeminiPublicacionesService } from './ia/gemini-publicaciones.service.js';
import { GeminiEmbeddingsService } from './ia/gemini-embeddings.service.js';
import { MobileConsentimientoController } from './ia/mobile-consentimiento.controller.js';
import { MobileConsentimientoService } from './ia/mobile-consentimiento.service.js';
import { MobileRecomendacionesSemanticasService } from './ia/mobile-recomendaciones-semanticas.service.js';
import { MobileIaPublicacionesController } from './ia/mobile-ia-publicaciones.controller.js';
import { MobileChatController } from './chat/mobile-chat.controller.js';
import { MobileChatService } from './chat/mobile-chat.service.js';
import { MobileNoLeidosService } from './chat/mobile-no-leidos.service.js';
import { MobileLecturaService } from './chat/mobile-lectura.service.js';
import { MobilePublicacionesController } from './publicaciones/mobile-publicaciones.controller.js';
import { MobilePublicidadController } from './publicidad/mobile-publicidad.controller.js';
import { MobilePublicidadService } from './publicidad/mobile-publicidad.service.js';

@Module({
  imports: [
    AuthModule,
    ChatModule,
    PrismaModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Mensaje.name, schema: MensajeSchema },
    ]),
  ],
  controllers: [
    MobileAuthController,
    MobileChatController,
    MobileIaPublicacionesController,
    MobileConsentimientoController,
    MobilePublicacionesController,
    MobilePublicidadController,
  ],
  providers: [
    GeminiPublicacionesService,
    GeminiEmbeddingsService,
    MobileConsentimientoService,
    MobileRecomendacionesSemanticasService,
    MobileChatService,
    MobileNoLeidosService,
    MobileLecturaService,
    MobilePublicidadService,
  ],
})
export class MobileModule {}
