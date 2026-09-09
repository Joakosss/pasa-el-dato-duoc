import { MOSAIC_SEED } from "./constants";
import { mulberry32 } from "./buildMosaicLayout";
import type { ProductCardData } from "@/components/product/ProductCard";

export const SPONSOR_SEED = MOSAIC_SEED + 1;
export const SPONSOR_OFFSET = 4;
export const SPONSOR_GAP = 6;
export const SPONSOR_TAIL_MIN = 3;

export function interleaveSponsored(
  products: ProductCardData[],
  sponsored: ProductCardData[],
  options?: { seed?: number },
): ProductCardData[] {
  if (sponsored.length === 0) return [...products];
  if (products.length === 0) return [...sponsored];
  const rand = mulberry32(options?.seed ?? SPONSOR_SEED);
  const mixed: ProductCardData[] = [...products];
  let pos = SPONSOR_OFFSET + Math.floor(rand() * 3);
  let i = 0;
  while (i < sponsored.length && pos < mixed.length - SPONSOR_TAIL_MIN) {
    mixed.splice(pos, 0, sponsored[i]);
    i++;
    pos += SPONSOR_GAP + Math.floor(rand() * 3) + 1;
  }
  // Sponsors sobrantes se anexan antes de la cola para no perderlos
  // y sin crear zona publicidad al final.
  while (i < sponsored.length) {
    const fallback = Math.max(
      SPONSOR_OFFSET,
      mixed.length - SPONSOR_TAIL_MIN - (sponsored.length - i) + 1,
    );
    mixed.splice(Math.min(fallback, mixed.length), 0, sponsored[i]);
    i++;
  }
  return mixed;
}
