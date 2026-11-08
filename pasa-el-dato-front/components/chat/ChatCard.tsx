import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import type { ConversacionListaDTO } from "@/domain/dtos/chat.dto";
import type { RolConversacion } from "@/domain/types/chat";
import { RolConversacionBadge } from "./RolConversacionBadge";

// TODO[MOMENTANEO]: el contrato del listado solo expone `contraparteCuentaId`.
// Falta `contraparteNombre` (y opcionalmente avatar) para mostrar el nombre
// real de la contraparte. Mientras tanto se usa una etiqueta genérica.
const ETIQUETA_CONTRAPARTE_MOMENTANEO = "Contraparte";

interface ChatCardProps {
  conversacion: ConversacionListaDTO;
  idCuentaActual?: string;
  rol: RolConversacion;
}

function formatFechaActividad(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

function vistaPrevia(
  conversacion: ConversacionListaDTO,
  idCuentaActual?: string,
): string {
  const ultimo = conversacion.ultimoMensaje;
  if (!ultimo) return "Sin mensajes aún. Escribe el primero.";
  const autor = ultimo.emisorCuentaId === idCuentaActual ? "Tú: " : "";
  return `${autor}${ultimo.texto}`;
}

function textoNoLeidos(cantidad: number): string {
  return cantidad === 1
    ? "1 mensaje sin leer"
    : `${cantidad} mensajes sin leer`;
}

export function ChatCard({
  conversacion,
  idCuentaActual,
  rol,
}: ChatCardProps) {
  const { publicacion } = conversacion;
  const titulo = publicacion.titulo ?? "Publicación no disponible";
  const noDisponible = publicacion.estado === "NO_DISPONIBLE";
  const noLeidos = conversacion.noLeidosCount;
  const etiquetaNoLeidos = noLeidos > 0 ? textoNoLeidos(noLeidos) : "";

  return (
    <li>
      <Link
        href={`/chats/${conversacion.conversacionId}`}
        aria-label={`Abrir chat sobre ${titulo}${etiquetaNoLeidos ? `, ${etiquetaNoLeidos}` : ""}`}
        className={cn(
          "card-hover flex items-center gap-3 rounded-xl border border-gray-200 bg-card p-4 transition hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          noDisponible && "opacity-80",
        )}
      >
        <Avatar name={titulo} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-navy">{titulo}</p>
            <span className="flex shrink-0 items-center gap-2">
              {noLeidos > 0 ? (
                <Badge variant="unread" ariaLabel={etiquetaNoLeidos}>
                  {noLeidos}
                </Badge>
              ) : null}
              <span className="text-xs text-gray-400">
                {formatFechaActividad(conversacion.actividadEn)}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <RolConversacionBadge rol={rol} />
            <span className="min-w-0 truncate">
              {ETIQUETA_CONTRAPARTE_MOMENTANEO} ·{" "}
              {conversacion.estadoPublicacionAlCrear}
            </span>
            {noDisponible ? (
              <Badge variant="reported" className="shrink-0">
                No disponible
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-sm text-gray-500">
            {vistaPrevia(conversacion, idCuentaActual)}
          </p>
        </div>
      </Link>
    </li>
  );
}
