import { io, type Socket } from 'socket.io-client';

import { env } from '@/config/env';
import type {
  ConversacionLeida,
  ListaMensajesChat,
  MensajeChat,
} from './chat-api';

type RespuestaSocket<T> = T | { message?: string };

export interface SocketChat {
  conectar: () => Promise<void>;
  desconectar: () => void;
  unirseAConversacion: (
    conversacionId: string,
  ) => Promise<ListaMensajesChat>;
  enviarMensaje: (conversacionId: string, texto: string) => Promise<MensajeChat>;
  marcarComoLeida: (conversacionId: string) => Promise<ConversacionLeida>;
  alRecibirMensaje: (listener: (mensaje: MensajeChat) => void) => () => void;
}

function obtenerUrlSocket(apiUrl: string): string {
  const url = new URL(apiUrl);
  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function obtenerMensajeError(respuesta: unknown): string {
  if (
    respuesta &&
    typeof respuesta === 'object' &&
    'message' in respuesta &&
    typeof respuesta.message === 'string'
  ) {
    return respuesta.message;
  }

  return 'No se pudo completar la operación de chat.';
}

function esperarConexion(socket: Socket): Promise<void> {
  if (socket.connected) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      limpiar();
      reject(new Error('No se pudo conectar al chat. Intenta nuevamente.'));
    }, 10_000);

    const alConectar = () => {
      limpiar();
      resolve();
    };

    const alError = () => {
      limpiar();
      reject(new Error('No se pudo conectar al chat. Intenta nuevamente.'));
    };

    const limpiar = () => {
      clearTimeout(timeout);
      socket.off('connect', alConectar);
      socket.off('connect_error', alError);
    };

    socket.once('connect', alConectar);
    socket.once('connect_error', alError);
    socket.connect();
  });
}

function emitirConRespuesta<T>(
  socket: Socket,
  evento: string,
  payload: Record<string, unknown>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.timeout(10_000).emit(evento, payload, (error: Error | null, respuesta: RespuestaSocket<T>) => {
      if (error) {
        reject(new Error('No se recibió respuesta del chat. Intenta nuevamente.'));
        return;
      }

      if (
        respuesta &&
        typeof respuesta === 'object' &&
        'message' in respuesta
      ) {
        reject(new Error(obtenerMensajeError(respuesta)));
        return;
      }

      resolve(respuesta as T);
    });
  });
}

export function crearSocketChat(accessToken: string): SocketChat {
  const socket = io(`${obtenerUrlSocket(env.apiUrl)}/chat`, {
    auth: { token: accessToken },
    autoConnect: false,
    transports: ['websocket'],
  });

  return {
    conectar: () => esperarConexion(socket),
    desconectar: () => socket.disconnect(),
    unirseAConversacion: async (conversacionId) => {
      const respuesta = await emitirConRespuesta<ListaMensajesChat>(
        socket,
        'chat:join_conversacion',
        { conversacionId, limit: 20 },
      );

      return {
        ...respuesta,
        items: respuesta.items.map((mensaje) => ({
          ...mensaje,
          enviadoEn: String(mensaje.enviadoEn),
        })),
      };
    },
    enviarMensaje: async (conversacionId, texto) => {
      const mensaje = await emitirConRespuesta<MensajeChat>(
        socket,
        'chat:enviar_mensaje',
        { conversacionId, texto },
      );

      return { ...mensaje, enviadoEn: String(mensaje.enviadoEn) };
    },
    marcarComoLeida: (conversacionId) =>
      emitirConRespuesta<ConversacionLeida>(
        socket,
        'chat:conversacionAbierta',
        { conversacionId },
      ),
    alRecibirMensaje: (listener) => {
      const manejarMensaje = (mensaje: MensajeChat) => {
        listener({ ...mensaje, enviadoEn: String(mensaje.enviadoEn) });
      };

      socket.on('chat:mensaje_nuevo', manejarMensaje);
      return () => socket.off('chat:mensaje_nuevo', manejarMensaje);
    },
  };
}
