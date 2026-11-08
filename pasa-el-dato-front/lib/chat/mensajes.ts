import type { MensajeDTO, MensajeWsDTO } from "@/domain/dtos/chat.dto";
import type { EstadoLecturaMensaje } from "@/domain/types/chat";

// Normaliza un mensaje WS (sin flags) al contrato del historial REST.
// Los flags son provisionales: el historial y el puntero confirmado los corrigen.
export function normalizarMensajeWs(
  mensaje: MensajeWsDTO,
  idCuentaActual?: string,
): MensajeDTO {
  const esPropio = mensaje.emisorCuentaId === idCuentaActual;
  return {
    ...mensaje,
    leido: esPropio,
    leidoPorContraparte: false,
  };
}

export function estadoLecturaMensaje(
  mensaje: MensajeDTO,
  idCuentaActual: string | undefined,
  leidoHastaMensajeId: string | null,
): EstadoLecturaMensaje {
  const esPropio = mensaje.emisorCuentaId === idCuentaActual;

  if (esPropio) {
    return mensaje.leidoPorContraparte ? "leido" : "enviado";
  }

  const leido =
    mensaje.leido ||
    (leidoHastaMensajeId !== null && mensaje.id <= leidoHastaMensajeId);

  return leido ? "leido" : "no-leido";
}

// Los ObjectId se comparan lexicográficamente igual que en el backend.
export function mayorObjectId(
  actual: string | null,
  nuevo: string | null,
): string | null {
  if (!actual) return nuevo;
  if (!nuevo) return actual;
  return actual >= nuevo ? actual : nuevo;
}
