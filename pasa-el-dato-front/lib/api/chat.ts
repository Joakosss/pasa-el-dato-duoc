import type {
  IniciarConversacionRequestDTO,
  IniciarConversacionRespuestaDTO,
  ListaMensajesDTO,
  ListarMensajesQuery,
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

// Origen WS del namespace /chat derivado de NEXT_PUBLIC_API_URL (sin /api).
export function obtenerOrigenChatSocket(apiUrl: string): string {
  return new URL(apiUrl).origin;
}
