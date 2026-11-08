import { cn } from "@/lib/utils/cn";
import type { RolConversacion } from "@/domain/types/chat";

const ETIQUETAS: Record<RolConversacion, string> = {
  VENDIENDO: "Vendiendo",
  COMPRANDO: "Comprando",
  DESCONOCIDO: "Rol no disponible",
};

const ESTILOS: Record<RolConversacion, string> = {
  VENDIENDO: "bg-green-100 text-green-700",
  COMPRANDO: "bg-navy/10 text-navy",
  DESCONOCIDO: "bg-gray-100 text-gray-600",
};

interface RolConversacionBadgeProps {
  rol: RolConversacion;
  className?: string;
}

export function RolConversacionBadge({
  rol,
  className,
}: RolConversacionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        ESTILOS[rol],
        className,
      )}
    >
      {ETIQUETAS[rol]}
    </span>
  );
}
