import type {
  IniciarConversacionRequestDTO,
  IniciarConversacionRespuestaDTO,
  ListaConversacionesDTO,
  ListaMensajesDTO,
  ListarConversacionesQuery,
  ListarMensajesQuery,
  MarcarConversacionLeidaRespuestaDTO,
} from "@/domain/dtos/chat.dto";
import { apiClient } from "./index";

// POST /chat/conversaciones { publicacionId } -> { conversacionId, creada } (201).
// Requiere sesión válida (cookie accessToken). Idempotente por par + publicación.
export async function iniciarConversacionApi(
  publicacionId: string,
): Promise<IniciarConversacionRespuestaDTO> {
  const payload: IniciarConversacionRequestDTO = { publicacionId };
  return apiClient.post<IniciarConversacionRespuestaDTO>(
    "/chat/conversaciones",
    payload,
  );
}

export const LIMITE_MENSAJES_WEB = 20;

// GET /chat/conversaciones?cursor=&limit= -> { items, nextCursor }.
// Solo conversaciones del usuario autenticado, ordenadas por actividad reciente.
// Limit web = 20 (móvil = 10, fuera de este cliente).
export const LIMITE_CONVERSACIONES_WEB = 20;

export async function listarConversacionesApi(
  query: ListarConversacionesQuery = {},
): Promise<ListaConversacionesDTO> {
  return apiClient.get<ListaConversacionesDTO>("/chat/conversaciones", {
    query: {
      cursor: query.cursor,
      limit: query.limit ?? LIMITE_CONVERSACIONES_WEB,
    },
  });
}

// GET /chat/conversaciones/:id/mensajes?cursor=&limit= -> { items desc, nextCursor }.
// Solo participantes. Cursor = id del último recibido; limit web = 20.
export async function listarMensajesApi(
  conversacionId: string,
  query: ListarMensajesQuery = {},
): Promise<ListaMensajesDTO> {
  return apiClient.get<ListaMensajesDTO>(
    `/chat/conversaciones/${encodeURIComponent(conversacionId)}/mensajes`,
    {
      query: {
        cursor: query.cursor,
        limit: query.limit ?? LIMITE_MENSAJES_WEB,
      },
    },
  );
}

// POST /chat/conversaciones/:id/leer -> { conversacionId, leidoHastaMensajeId }.
// Idempotente. Marca como leídos los mensajes de la contraparte al abrir.
export async function marcarConversacionComoLeidaApi(
  conversacionId: string,
): Promise<MarcarConversacionLeidaRespuestaDTO> {
  return apiClient.post<MarcarConversacionLeidaRespuestaDTO>(
    `/chat/conversaciones/${encodeURIComponent(conversacionId)}/leer`,
  );
}

// Ruta del engine Socket.IO bajo el mismo origen del front. Debe empezar con
// /api para que el navegador envíe la cookie accessToken (Path=/api del back).
// next.config.ts proxya esta ruta a /socket.io del back.
export const RUTA_SOCKET_CHAT = "/api/socket.io";

// Namespace del gateway de chat.
export const NAMESPACE_CHAT = "/chat";
