import type { ListaMensajesChat, MensajeChat } from './chat-api';

export async function recuperarMensajesReconexión(
  primeraPagina: ListaMensajesChat,
  mensajeReferenciaId: string | null,
  obtenerPagina: (cursor: string) => Promise<ListaMensajesChat>,
  vigente: () => boolean,
  maxPaginas = 50,
): Promise<{ mensajes: MensajeChat[]; completa: boolean; siguienteCursor: string | null }> {
  const mensajes = [...primeraPagina.items];
  let cursor = primeraPagina.nextCursor;
  const cursores = new Set<string>();
  let paginas = 0;

  while (vigente()) {
    if ((mensajeReferenciaId !== null && mensajes.some((mensaje) => mensaje.id === mensajeReferenciaId)) || cursor === null) {
      return { mensajes, completa: true, siguienteCursor: null };
    }
    if (paginas >= maxPaginas || cursores.has(cursor)) {
      return { mensajes, completa: false, siguienteCursor: cursor };
    }
    cursores.add(cursor);
    try {
      const siguiente = await obtenerPagina(cursor);
      if (!vigente()) return { mensajes, completa: false, siguienteCursor: cursor };
      mensajes.push(...siguiente.items);
      cursor = siguiente.nextCursor;
      paginas += 1;
    } catch {
      return { mensajes, completa: false, siguienteCursor: cursor };
    }
  }

  return { mensajes, completa: false, siguienteCursor: cursor };
}
