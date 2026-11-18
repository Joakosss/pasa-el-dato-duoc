"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Icono } from "@/components/ui/Icono";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils/cn";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";
import { useEstadoFavorito } from "@/hooks/use-estado-favorito";
import { useToggleFavorito } from "@/hooks/use-toggle-favorito";

interface BotonFavoritoProps {
  publicacionId: string;
  variante?: "tarjeta" | "detalle";
  className?: string;
}

// Control reutilizable HU-FAV-01 (FE01): mismo comportamiento en tarjeta y
// detalle. Sin optimismo: cambia solo tras éxito; el error conserva el
// estado anterior (toast centralizado en useToggleFavorito).
export function BotonFavorito({
  publicacionId,
  variante = "tarjeta",
  className,
}: BotonFavoritoProps) {
  const router = useRouter();
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  const { esFavorito, isCargando: isCargandoEstado } =
    useEstadoFavorito(publicacionId);
  const toggle = useToggleFavorito();

  const isOcupado = isCargandoEstado || toggle.isPending;

  const accionar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    // La tarjeta es un <Link>: no debe navegar al alternar.
    evento.preventDefault();
    evento.stopPropagation();
    if (isOcupado) return;
    if (!estaAutenticado) {
      toast.error("Debes iniciar sesión para guardar favoritos.");
      router.replace(ROUTES.login);
      return;
    }
    toggle.mutate({ publicacionId, esFavoritoActual: esFavorito });
  };

  return (
    <button
      type="button"
      aria-pressed={esFavorito}
      aria-busy={isOcupado}
      aria-disabled={isOcupado}
      disabled={isOcupado}
      aria-label={
        esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"
      }
      title={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={accionar}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        variante === "tarjeta"
          ? "h-9 w-9 bg-white/95 text-navy shadow-sm hover:border-gold hover:text-red-500"
          : "h-11 flex-1 gap-2 border-gray-200 bg-white px-4 text-sm font-semibold text-navy hover:border-gold hover:bg-gold/10 sm:flex-none sm:px-6",
        esFavorito && "border-gold text-red-500",
        isOcupado && "cursor-wait opacity-70",
        className,
      )}
    >
      <Icono
        nombre="corazon"
        size={variante === "tarjeta" ? 18 : 20}
        relleno={esFavorito}
        className={cn(isOcupado && "animate-pulse")}
      />
      {variante === "detalle" ? (
        <span>{esFavorito ? "Guardada" : "Guardar"}</span>
      ) : null}
    </button>
  );
}
