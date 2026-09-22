import type { ProductCardDataMomentaneo } from "@/components/product/ProductCard";

// TODO[MOMENTANEO]: mock sin contrato back. Reemplazar por fetch a /publicaciones con dominio real.
// Por ahora genera placeholders deterministas por página para habilitar
// Suspense + paginación sin inventar contrato API.
export const FEATURED_PER_PAGE_MOMENTANEO = 20;
export const SPONSORED_PER_PAGE_MOMENTANEO = 4;
export const TOTAL_PAGES_MOMENTANEO = 5;

export async function getFeaturedPageMomentaneo(page: number): Promise<{
  items: ProductCardDataMomentaneo[];
  sponsored: ProductCardDataMomentaneo[];
  page: number;
  totalPages: number;
}> {
  const safePage = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), TOTAL_PAGES_MOMENTANEO) : 1;

  const items: ProductCardDataMomentaneo[] = Array.from({ length: FEATURED_PER_PAGE_MOMENTANEO }, (_, i) => ({
    id: `p${safePage}-placeholder-${i + 1}`,
  }));

  const sponsored: ProductCardDataMomentaneo[] = Array.from({ length: SPONSORED_PER_PAGE_MOMENTANEO }, (_, i) => ({
    id: `p${safePage}-sponsored-${i + 1}`,
    sponsored: true,
  }));

  return { items, sponsored, page: safePage, totalPages: TOTAL_PAGES_MOMENTANEO };
}
