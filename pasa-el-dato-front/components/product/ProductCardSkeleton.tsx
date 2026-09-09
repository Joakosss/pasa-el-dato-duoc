import { cn } from "@/lib/utils/cn";
import type { CardSize } from "./ProductCard";

export function ProductCardSkeleton({ size }: { size?: CardSize }) {
  const large = size === "2x2";
  return (
    <article
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-xl border border-gray-200 bg-card",
        large && "col-span-2 md:row-span-2",
      )}
    >
      <div className="relative">
        <div className={cn("w-full animate-pulse bg-gray-200", large ? "aspect-[2/1] md:aspect-square" : "aspect-video")} />
        <span className="absolute left-2 top-2 h-5 w-16 rounded-md bg-gray-200" />
      </div>
      <div className="space-y-2 border-t border-gray-100 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </article>
  );
}
