// Espejo de IniciarConversacionDto del back (POST /chat/conversaciones).
export interface IniciarConversacionRequestDTO {
  publicacionId: string;
}

// Espejo de ConversacionCreadaRespuestaDto del back.
export interface IniciarConversacionRespuestaDTO {
  conversacionId: string;
  creada: boolean;
}

// Espejo de MensajeRespuestaDto del back (GET historial + eventos WS).
export interface MensajeDTO {
  id: string;
  conversacionId: string;
  emisorCuentaId: string;
  texto: string;
  enviadoEn: string;
}

// Espejo de ListaMensajesRespuestaDto del back.
export interface ListaMensajesDTO {
  items: MensajeDTO[];
  nextCursor: string | null;
}

// Espejo de ListarMensajesQueryDto del back (web usa limit 20).
export interface ListarMensajesQuery {
  cursor?: string;
  limit?: number;
}
