// Espejo de IniciarConversacionDto del back (POST /chat/conversaciones).
export interface IniciarConversacionRequestDTO {
  publicacionId: string;
}

// Espejo de ConversacionCreadaRespuestaDto del back.
export interface IniciarConversacionRespuestaDTO {
  conversacionId: string;
  creada: boolean;
}

// Espejo de MensajeRespuestaDto del back (GET historial REST).
export interface MensajeDTO {
  id: string;
  conversacionId: string;
  emisorCuentaId: string;
  texto: string;
  enviadoEn: string;
  leido: boolean;
  leidoPorContraparte: boolean;
}

// Payload WS del gateway: no incluye flags de lectura (MensajeWsRespuesta del back).
export type MensajeWsDTO = Omit<
  MensajeDTO,
  "leido" | "leidoPorContraparte"
>;

// Espejo de MarcarConversacionLeidaRespuestaDto del back
// (POST /chat/conversaciones/:id/leer).
export interface MarcarConversacionLeidaRespuestaDTO {
  conversacionId: string;
  leidoHastaMensajeId: string | null;
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

// Espejo de ConversacionPublicacionListaDto del back.
export interface ConversacionPublicacionDTO {
  id: string;
  estado: "VISIBLE" | "NO_DISPONIBLE";
  titulo?: string;
}

// Espejo de ConversacionUltimoMensajeDto del back.
export interface ConversacionUltimoMensajeDTO {
  texto: string;
  enviadoEn: string;
  emisorCuentaId: string;
}

// Espejo de ConversacionListaItemDto del back.
export interface ConversacionListaDTO {
  conversacionId: string;
  contraparteCuentaId: string;
  estadoPublicacionAlCrear: string;
  publicacion: ConversacionPublicacionDTO;
  ultimoMensaje?: ConversacionUltimoMensajeDTO;
  noLeidosCount: number;
  actividadEn: string;
}

// Espejo de ListaConversacionesRespuestaDto del back.
export interface ListaConversacionesDTO {
  items: ConversacionListaDTO[];
  nextCursor: string | null;
}

// Espejo de ListarConversacionesQueryDto del back (web usa limit 20).
export interface ListarConversacionesQuery {
  cursor?: string;
  limit?: number;
}
