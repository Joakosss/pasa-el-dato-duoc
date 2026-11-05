import { cn } from "@/lib/utils/cn";
import type { MensajeDTO } from "@/domain/dtos/chat.dto";

interface MensajeBurbujaProps {
  mensaje: MensajeDTO;
  esPropio: boolean;
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

export function MensajeBurbuja({ mensaje, esPropio }: MensajeBurbujaProps) {
  return (
    <li
      className={cn("flex", esPropio ? "justify-end" : "justify-start")}
      aria-label={esPropio ? "Tu mensaje" : "Mensaje recibido"}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm",
          esPropio
            ? "rounded-br-md bg-navy text-white"
            : "rounded-bl-md border border-gray-200 bg-card text-navy",
        )}
      >
        <p className="whitespace-pre-line break-words">{mensaje.texto}</p>
        <p
          className={cn(
            "mt-1 text-right text-[11px]",
            esPropio ? "text-white/70" : "text-gray-400",
          )}
        >
          {formatearHora(mensaje.enviadoEn)}
        </p>
      </div>
    </li>
  );
}
