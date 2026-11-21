import type { ListaMensajesChat, MensajeChat } from './chat-api';

export interface ContinuacionLectura {
  cursor: string;
  mensajeId: string | null;
  mensajes: MensajeChat[];
  cursores: string[];
}

export type ResultadoLectura =
  | { completa: true; mensajeId: string | null; mensajes: MensajeChat[] }
  | { completa: false; continuacion: ContinuacionLectura };

export async function calcularLectura(
  cuentaId: string,
  obtenerPagina: (cursor?: string) => Promise<ListaMensajesChat>,
  vigente: () => boolean,
  maxPaginas = 50,
  continuacion?: ContinuacionLectura,
): Promise<ResultadoLectura | null> {
  const mensajes = [...(continuacion?.mensajes ?? [])];
  const cursores = new Set(continuacion?.cursores ?? []);
  let cursor = continuacion?.cursor;
  let mensajeId = continuacion?.mensajeId ?? null;

  for (let i = 0; i < maxPaginas && vigente(); i++) {
    let pagina: ListaMensajesChat;
    try {
      pagina = await obtenerPagina(cursor);
    } catch {
      return null;
    }
    if (!vigente()) return null;
    mensajes.push(...pagina.items);
    const recibidos = pagina.items.filter((mensaje) => mensaje.emisorCuentaId !== cuentaId);
    if (recibidos.some((mensaje) => typeof mensaje.leido !== 'boolean')) return null;
    for (const mensaje of recibidos) {
      if (!mensaje.leido && (!mensajeId || mensaje.id > mensajeId)) mensajeId = mensaje.id;
    }
    if (recibidos.some((mensaje) => mensaje.leido) || pagina.nextCursor === null) {
      return { completa: true, mensajeId, mensajes };
    }
    if (cursores.has(pagina.nextCursor)) return null;
    cursores.add(pagina.nextCursor);
    cursor = pagina.nextCursor;
  }

  if (!vigente() || !cursor) return null;
  return {
    completa: false,
    continuacion: { cursor, mensajeId, mensajes, cursores: [...cursores] },
  };
}
