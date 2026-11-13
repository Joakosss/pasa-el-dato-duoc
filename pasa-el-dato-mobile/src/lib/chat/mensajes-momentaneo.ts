import type { ChatFeed } from './chats-placeholder';

export interface MensajeChatMomentaneo {
  id: string;
  contenido: string;
  enviadoPorMi: boolean;
  fecha: string;
}

const MENSAJES_POR_CHAT_MOMENTANEO: Record<string, MensajeChatMomentaneo[]> = {
  'chat-1': [
    {
      id: 'chat-1-1',
      contenido: 'Hola, ¿la calculadora sigue disponible?',
      enviadoPorMi: true,
      fecha: '2026-09-09T15:18:00.000Z',
    },
    {
      id: 'chat-1-2',
      contenido: '¡Hola! Sí, aún está disponible.',
      enviadoPorMi: false,
      fecha: '2026-09-09T15:20:00.000Z',
    },
    {
      id: 'chat-1-3',
      contenido: '¿Sigue disponible para mañana en sede?',
      enviadoPorMi: true,
      fecha: '2026-09-09T15:30:00.000Z',
    },
  ],
  'chat-2': [
    {
      id: 'chat-2-1',
      contenido: 'Hola, me interesa el libro de redes.',
      enviadoPorMi: false,
      fecha: '2026-09-08T18:04:00.000Z',
    },
    {
      id: 'chat-2-2',
      contenido: 'Sí, disponible. ¿Puedes retirar hoy?',
      enviadoPorMi: true,
      fecha: '2026-09-08T18:15:00.000Z',
    },
  ],
  'chat-3': [
    {
      id: 'chat-3-1',
      contenido: '¿Podemos vernos a las 12 en la entrada?',
      enviadoPorMi: true,
      fecha: '2026-09-07T11:50:00.000Z',
    },
    {
      id: 'chat-3-2',
      contenido: 'Perfecto, nos vemos a las 12',
      enviadoPorMi: false,
      fecha: '2026-09-07T12:00:00.000Z',
    },
  ],
};

export function obtenerMensajesChatMomentaneo(chat: ChatFeed): MensajeChatMomentaneo[] {
  return (
    MENSAJES_POR_CHAT_MOMENTANEO[chat.id] ?? [
      {
        id: `${chat.id}-inicial`,
        contenido: chat.ultimoMensaje,
        enviadoPorMi: chat.contraparte === 'Tú',
        fecha: chat.ultimaFecha,
      },
    ]
  );
}
