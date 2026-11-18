"use client";

interface ResumenResultadosProps {
  total: number;
  hayFiltros: boolean;
  onLimpiar: () => void;
}

export function ResumenResultados({
  total,
  hayFiltros,
  onLimpiar,
}: ResumenResultadosProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[13px] text-gray-500" aria-live="polite">
        {total} {total === 1 ? "resultado" : "resultados"}
      </p>
      {hayFiltros ? (
        <button
          type="button"
          onClick={onLimpiar}
          className="flex min-h-[32px] cursor-pointer items-center gap-1 text-[13px] font-bold text-navy transition hover:text-gold"
        >
          <svg
            className="h-[15px] w-[15px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 6h13M3 12h9M3 18h5M17 8l4 4m0-4l-4 4"
            />
          </svg>
          Limpiar
        </button>
      ) : null}
    </div>
  );
}
