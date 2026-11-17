import { ProductCard, type ProductCardData } from "./ProductCard";
import { BannerCard } from "./BannerCard";

export function ProductGrid({ items }: { items: ProductCardData[] }) {
  return (
    <div className="grid grid-flow-dense grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) =>
        // Los banners no enlazan a /product/:id (HU-PU-05).
        item.banner ? (
          <BannerCard key={item.id} item={item} />
        ) : (
          <ProductCard key={item.id} item={item} />
        ),
      )}
    </div>
  );
}
