import { cn } from "@/lib/utils/cn";

interface EstrellasProps {
  valor: number;
  size?: number;
  className?: string;
}

// Estrellas de solo lectura (0-5). Mismo lenguaje visual que
// EstrellasMomentaneo de la app móvil: ★ sólida en gold, ★ hueca en gris.
// El glifo ★ ya se usa en CalificarEnChat, así que no aporta dependencias.
export function Estrellas({ valor, size = 18, className }: EstrellasProps) {
  const redondeado = Math.round(valor);

  return (
    <span
      role="img"
      aria-label={`Puntaje ${valor} de 5`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((posicion) => (
        <span
          key={posicion}
          aria-hidden="true"
          className={cn(
            "leading-none",
            posicion <= redondeado ? "text-gold" : "text-gray-300",
          )}
          style={{ fontSize: size }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
