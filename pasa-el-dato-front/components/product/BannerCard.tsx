import { Badge } from "@/components/ui/Badge";
import type { ProductCardData } from "./ProductCard";

// Card de banner publicitario (HU-PU-05): artículo no clicable dentro del
// mosaico, sin destino de producto (el catálogo de la HU no define landing
// ni métricas de clic, ambas fuera de alcance).
export function BannerCard({ item }: { item: ProductCardData }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-gold/30 bg-card">
      <div className="absolute right-2 top-2 z-10">
        <Badge variant="sponsored">Sponsored</Badge>
      </div>
      <div className="relative">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title ?? "Banner publicitario"}
            className="h-44 w-full bg-gray-200 object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label="Banner sin imagen"
            className="h-44 w-full bg-gray-200"
          />
        )}
      </div>
      <div className="border-t border-gray-100 p-3">
        {item.title ? (
          <h3 className="mb-1 text-sm font-semibold leading-tight text-navy">
            {item.title}
          </h3>
        ) : null}
        {item.meta ? (
          <p className="text-xs text-gray-500">{item.meta}</p>
        ) : null}
      </div>
    </article>
  );
}
