import type { ProductCardDataTemporal } from "@/components/product/ProductCard";

// TODO[TEMPORAL]: mock sin contrato back. Reemplazar por fetch a /publicaciones con dominio real.
// Por ahora genera placeholders deterministas por página para habilitar
// Suspense + paginación sin inventar contrato API.
export const FEATURED_PER_PAGE_TEMPORAL = 20;
export const SPONSORED_PER_PAGE_TEMPORAL = 4;
export const TOTAL_PAGES_TEMPORAL = 5;

export async function getFeaturedPageTemporal(page: number): Promise<{
  items: ProductCardDataTemporal[];
  sponsored: ProductCardDataTemporal[];
  page: number;
  totalPages: number;
}> {
  const safePage = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), TOTAL_PAGES_TEMPORAL) : 1;

  const items: ProductCardDataTemporal[] = Array.from({ length: FEATURED_PER_PAGE_TEMPORAL }, (_, i) => ({
    id: `p${safePage}-placeholder-${i + 1}`,
  }));

  const sponsored: ProductCardDataTemporal[] = Array.from({ length: SPONSORED_PER_PAGE_TEMPORAL }, (_, i) => ({
    id: `p${safePage}-sponsored-${i + 1}`,
    sponsored: true,
  }));

  return { items, sponsored, page: safePage, totalPages: TOTAL_PAGES_TEMPORAL };
}
