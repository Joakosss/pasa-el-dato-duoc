"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        {error.message || "Error inesperado. Inténtalo de nuevo."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-foreground px-5 py-2.5 text-background"
      >
        Reintentar
      </button>
    </div>
  );
}
