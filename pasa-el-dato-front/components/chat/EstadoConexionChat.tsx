import { cn } from "@/lib/utils/cn";

interface EstadoConexionChatProps {
  conectado: boolean;
  tieneAnteriores: boolean;
  cargandoAnteriores: boolean;
  onCargarAnteriores: () => void;
}

export function EstadoConexionChat({
  conectado,
  tieneAnteriores,
  cargandoAnteriores,
  onCargarAnteriores,
}: EstadoConexionChatProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-card px-3 py-2">
      <p
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          conectado ? "text-green-700" : "text-gray-500",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            conectado ? "bg-green-500" : "bg-gray-300",
          )}
        />
        {conectado ? "En línea" : "Reconectando…"}
      </p>
      {tieneAnteriores ? (
        <button
          type="button"
          onClick={onCargarAnteriores}
          disabled={cargandoAnteriores}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-navy transition hover:border-gold disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {cargandoAnteriores ? "Cargando…" : "Cargar anteriores"}
        </button>
      ) : null}
    </div>
  );
}
