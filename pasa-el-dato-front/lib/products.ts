import type { ProductCardData } from "@/components/product/ProductCard";

// TODO: reemplazar por fetch real paginado al backend cuando exista el contrato.
// Por ahora genera placeholders deterministas por página para habilitar
// Suspense + paginación sin inventar contrato API.
export const FEATURED_PER_PAGE = 20;
export const SPONSORED_PER_PAGE = 4;
export const TOTAL_PAGES = 5;

export async function getFeaturedPage(page: number): Promise<{
  items: ProductCardData[];
  sponsored: ProductCardData[];
  page: number;
  totalPages: number;
}> {
  const safePage = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), TOTAL_PAGES) : 1;

  const items: ProductCardData[] = Array.from({ length: FEATURED_PER_PAGE }, (_, i) => ({
    id: `p${safePage}-placeholder-${i + 1}`,
  }));

  const sponsored: ProductCardData[] = Array.from({ length: SPONSORED_PER_PAGE }, (_, i) => ({
    id: `p${safePage}-sponsored-${i + 1}`,
    sponsored: true,
  }));

  return { items, sponsored, page: safePage, totalPages: TOTAL_PAGES };
}
