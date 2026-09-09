import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export type CardSize = "1x1" | "2x2";

export interface ProductCardData {
  id: string;
  category?: string;
  title?: string;
  meta?: string;
  price?: string;
  seller?: string;
  sponsored?: boolean;
  featured?: boolean;
  size?: CardSize;
}

export function ProductCard({ item }: { item: ProductCardData }) {
  const large = item.size === "2x2" || (!item.size && item.featured);
  return (
    <Link
      href={`/product/${item.id}`}
      className={cn(
        "card-hover relative cursor-pointer overflow-hidden rounded-xl border bg-card",
        item.sponsored ? "border-gold/30" : "border-gray-200",
        large && "col-span-2 md:row-span-2",
      )}
    >
      {item.sponsored ? (
        <div className="absolute right-2 top-2 z-10">
          <Badge variant="sponsored">Sponsored</Badge>
        </div>
      ) : null}
      <div className="relative">
        <div
          role="img"
          aria-label="Imagen placeholder"
          className={cn("w-full bg-gray-200", item.featured ? "h-full min-h-44" : "h-44")}
        />
        {item.category ? (
          <span className="absolute left-2 top-2">
            <Badge variant="category">{item.category}</Badge>
          </span>
        ) : (
          <span className="absolute left-2 top-2 h-5 w-16 rounded-md bg-gray-200" aria-hidden="true" />
        )}
      </div>
      <div className="border-t border-gray-100 p-3">
        {item.title ? (
          <h3 className="mb-1 text-sm font-semibold leading-tight text-navy">{item.title}</h3>
        ) : (
          <div className="mb-2 h-4 w-3/4 rounded bg-gray-100" aria-hidden="true" />
        )}
        {item.meta ? (
          <p className="mb-2 text-xs text-gray-500">{item.meta}</p>
        ) : (
          <div className="mb-2 h-3 w-1/2 rounded bg-gray-100" aria-hidden="true" />
        )}
        <div className="flex items-center justify-between">
          {item.price ? (
            <span className="text-base font-bold text-navy">{item.price}</span>
          ) : (
            <div className="h-4 w-16 rounded bg-gray-100" aria-hidden="true" />
          )}
          <div className="flex items-center gap-1">
            <Avatar name={item.seller} size="sm" />
            {item.seller ? (
              <span className="text-xs text-gray-400">{item.seller}</span>
            ) : (
              <span className="h-3 w-10 rounded bg-gray-100" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
