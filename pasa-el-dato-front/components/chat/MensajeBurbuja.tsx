import { cn } from "@/lib/utils/cn";
import type { MensajeDTO } from "@/domain/dtos/chat.dto";
import type { EstadoLecturaMensaje } from "@/domain/types/chat";

interface MensajeBurbujaProps {
  mensaje: MensajeDTO;
  esPropio: boolean;
  estadoLectura: EstadoLecturaMensaje;
}

function formatearHora(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function etiquetaEstado(
  esPropio: boolean,
  estadoLectura: EstadoLecturaMensaje,
): string {
  if (esPropio) {
    return estadoLectura === "leido"
      ? "Tu mensaje, leído por la contraparte"
      : "Tu mensaje, enviado";
  }
  return estadoLectura === "leido"
    ? "Mensaje recibido, leído"
    : "Mensaje recibido, no leído";
}

export function MensajeBurbuja({
  mensaje,
  esPropio,
  estadoLectura,
}: MensajeBurbujaProps) {
  const esLeido = estadoLectura === "leido";
  const textoEstado = esPropio
    ? esLeido
      ? "Leído"
      : "Enviado"
    : esLeido
      ? null
      : "No leído";

  return (
    <li className={cn("flex", esPropio ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm",
          esPropio
            ? "rounded-br-md bg-navy text-white"
            : "rounded-bl-md border border-gray-200 bg-card text-navy",
        )}
      >
        <span className="sr-only">
          {etiquetaEstado(esPropio, estadoLectura)}:{" "}
        </span>
        <p className="whitespace-pre-line break-words">{mensaje.texto}</p>
        <div className="mt-1 flex items-center justify-end gap-1.5">
          {textoEstado ? (
            <span
              className={cn(
                esPropio
                  ? esLeido
                    ? "text-[11px] text-gold"
                    : "text-[11px] text-white/60"
                  : "rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-navy",
              )}
            >
              {textoEstado}
            </span>
          ) : null}
          <span
            className={cn(
              "text-[11px]",
              esPropio ? "text-white/70" : "text-gray-400",
            )}
          >
            {formatearHora(mensaje.enviadoEn)}
          </span>
        </div>
      </div>
    </li>
  );
}
