import { ProductCard, type ProductCardData } from "./ProductCard";

export function ProductGrid({ items }: { items: ProductCardData[] }) {
  return (
    <div className="grid grid-flow-dense grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  );
}
