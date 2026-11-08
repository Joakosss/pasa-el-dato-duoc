import type { ConversacionListaDTO } from "@/domain/dtos/chat.dto";
import type { RolConversacion } from "@/domain/types/chat";
import { ChatCard } from "./ChatCard";

interface ChatListProps {
  conversaciones: ConversacionListaDTO[];
  idCuentaActual?: string;
  rolPorConversacion: ReadonlyMap<string, RolConversacion>;
}

export function ChatList({
  conversaciones,
  idCuentaActual,
  rolPorConversacion,
}: ChatListProps) {
  return (
    <ul aria-label="Mis conversaciones" className="space-y-3">
      {conversaciones.map((conversacion) => (
        <ChatCard
          key={conversacion.conversacionId}
          conversacion={conversacion}
          idCuentaActual={idCuentaActual}
          rol={rolPorConversacion.get(conversacion.conversacionId) ?? "DESCONOCIDO"}
        />
      ))}
    </ul>
  );
}
