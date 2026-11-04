import { buildMosaicLayout } from "@/lib/mosaic/buildMosaicLayout";
import type { ProductCardData } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

export function ProductGridSkeleton({ count }: { count: number }) {
  const dummies: ProductCardData[] = Array.from({ length: count }, (_, i) => ({
    id: `skeleton-${i}`,
  }));
  const sized = buildMosaicLayout(dummies);

  return (
    <div
      aria-hidden="true"
      aria-label="Cargando productos"
      className="grid grid-flow-dense grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5"
    >
      {sized.map((item) => (
        <ProductCardSkeleton key={item.id} size={item.size} />
      ))}
    </div>
  );
}
