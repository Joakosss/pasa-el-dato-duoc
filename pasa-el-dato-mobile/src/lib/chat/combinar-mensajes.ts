import type { MensajeChat } from './chat-api';

export function agregarMensajeSinDuplicados(
  actuales: MensajeChat[],
  mensaje: MensajeChat,
): MensajeChat[] {
  if (actuales.some((item) => item.id === mensaje.id)) return actuales;
  return [...actuales, mensaje].sort(
    (a, b) => new Date(a.enviadoEn).getTime() - new Date(b.enviadoEn).getTime(),
  );
}
