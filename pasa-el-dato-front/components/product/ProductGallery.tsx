import { cn } from "@/lib/utils/cn";

export function ProductGallery() {
  return (
    <div className="mb-6 flex h-auto flex-col gap-3 sm:h-[70vh] sm:flex-row">
      <div className="relative h-72 w-full overflow-hidden rounded-xl border border-gray-200 bg-card sm:h-full sm:w-4/5">
        <div
          role="img"
          aria-label="Imagen principal placeholder"
          className="h-full w-full bg-gray-200"
        />
      </div>
      <div className="flex h-20 w-full flex-row gap-2 sm:h-full sm:w-1/5 sm:flex-col">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            role="img"
            aria-label={`Miniatura placeholder ${i + 1}`}
            className={cn(
              "flex-1 overflow-hidden rounded-lg border-2 bg-gray-200",
              i === 0 ? "border-gold" : "border-gray-200",
            )}
          />
        ))}
      </div>
    </div>
  );
}
