import { Button } from "@/components/ui/Button";

interface PerfilErrorProps {
  mensaje: string;
  reintentando?: boolean;
  onReintentar: () => void;
}

export function PerfilError({
  mensaje,
  reintentando = false,
  onReintentar,
}: PerfilErrorProps) {
  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center shadow-sm"
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-navy">No pudimos cargar tu perfil</h2>
      <p className="mt-1 text-sm text-gray-500">{mensaje}</p>
      <Button
        variant="primary"
        size="md"
        className="mt-6"
        onClick={onReintentar}
        disabled={reintentando}
      >
        {reintentando ? "Reintentando…" : "Reintentar"}
      </Button>
    </div>
  );
}
