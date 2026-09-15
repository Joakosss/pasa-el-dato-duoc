import { cn } from "@/lib/utils/cn";
import { PASOS_REGISTRO } from "./types";

interface StepperProps {
  actual: number;
  maxVisitado: number;
  respondidos: boolean[];
  onIr: (paso: number) => void;
}

export function Stepper({ actual, maxVisitado, respondidos, onIr }: StepperProps) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Progreso del registro">
      {PASOS_REGISTRO.map((nombre, i) => {
        const activo = i === actual;
        const respondido = respondidos[i] ?? false;
        const visitado = i <= maxVisitado;
        return (
          <li key={nombre} className="flex flex-1 items-center gap-2 last:flex-none">
            <button
              type="button"
              disabled={!visitado}
              onClick={() => onIr(i)}
              aria-current={activo ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-1 py-1 text-left",
                visitado ? "cursor-pointer" : "cursor-default",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  activo && "bg-gold text-navy",
                  !activo && respondido && "bg-navy text-gold",
                  !activo && !respondido && "bg-gray-100 text-gray-400",
                )}
              >
                {!activo && respondido ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:inline",
                  activo || respondido ? "text-navy" : "text-gray-400",
                )}
              >
                {nombre}
              </span>
            </button>
            {i < PASOS_REGISTRO.length - 1 ? (
              <span
                aria-hidden
                className={cn("h-px flex-1", respondidos[i] ? "bg-navy" : "bg-gray-200")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
