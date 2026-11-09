import { apiClient } from '@/lib/api';

export interface ConversacionPublicacion {
  id: string;
  estado: 'VISIBLE' | 'NO_DISPONIBLE';
  titulo?: string;
}

export interface UltimoMensajeConversacion {
  texto: string;
  enviadoEn: string;
  emisorCuentaId: string;
}

export interface ConversacionChat {
  conversacionId: string;
  publicacionId: string;
  contraparteCuentaId: string;
  rolEnTransaccion: 'vendedor' | 'comprador';
  contraparte: {
    primerNombre: string;
    enLinea: boolean;
  };
  estadoPublicacionAlCrear: string;
  publicacion: ConversacionPublicacion;
  ultimoMensaje?: UltimoMensajeConversacion;
  noLeidosCount: number;
  actividadEn: string;
}

export interface ListaConversacionesChat {
  items: ConversacionChat[];
  nextCursor: string | null;
}

export interface MensajeChat {
  id: string;
  conversacionId: string;
  emisorCuentaId: string;
  texto: string;
  enviadoEn: string;
  leido?: boolean;
  leidoPorContraparte?: boolean;
}

export interface ListaMensajesChat {
  items: MensajeChat[];
  nextCursor: string | null;
}

export interface ConversacionLeida {
  conversacionId: string;
  leidoHastaMensajeId: string | null;
}

export interface ConversacionCreada {
  conversacionId: string;
  creada: boolean;
}

export interface ConversacionIniciadaConMensaje extends ConversacionCreada {
  mensaje: MensajeChat;
}

function conToken(accessToken: string) {
  return { accessToken };
}

export function iniciarConversacionConMensaje(
  accessToken: string,
  publicacionId: string,
  texto: string,
): Promise<ConversacionIniciadaConMensaje> {
  return apiClient.post<ConversacionIniciadaConMensaje>(
    '/mobile/chat/conversaciones/iniciar-con-mensaje',
    { publicacionId, texto },
    conToken(accessToken),
  );
}

export function listarConversaciones(
  accessToken: string,
  cursor?: string,
): Promise<ListaConversacionesChat> {
  return apiClient.get<ListaConversacionesChat>('/mobile/chat/conversaciones', {
    ...conToken(accessToken),
    query: { cursor, limit: 20 },
  });
}

export function enviarMensaje(
  accessToken: string,
  conversacionId: string,
  texto: string,
): Promise<MensajeChat> {
  return apiClient.post<MensajeChat>(
    `/mobile/chat/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`,
    { texto },
    conToken(accessToken),
  );
}

export function listarMensajes(
  accessToken: string,
  conversacionId: string,
  cursor?: string,
): Promise<ListaMensajesChat> {
  return apiClient.get<ListaMensajesChat>(
    `/mobile/chat/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`,
    {
      ...conToken(accessToken),
      query: { cursor, limit: 20 },
    },
  );
}

export function marcarConversacionLeida(
  accessToken: string,
  conversacionId: string,
): Promise<ConversacionLeida> {
  return apiClient.post<ConversacionLeida>(
    `/mobile/chat/conversaciones/${encodeURIComponent(conversacionId)}/leer`,
    undefined,
    conToken(accessToken),
  );
}
