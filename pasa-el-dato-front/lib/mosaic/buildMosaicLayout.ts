import {
  MOSAIC_SEED,
  MOSAIC_SMALL_PER_LARGE,
  MOSAIC_TAIL_MIN,
} from "./constants";
import type { CardSize, ProductCardData } from "@/components/product/ProductCard";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildMosaicLayout(
  items: ProductCardData[],
  options?: { seed?: number },
): ProductCardData[] {
  const seed = options?.seed ?? MOSAIC_SEED;
  const rand = mulberry32(seed);
  // Offset inicial SMALL..SMALL+2: varía primer grande sin romper primera fila.
  const firstLargeAt =
    MOSAIC_SMALL_PER_LARGE + Math.floor(rand() * 3);
  const cycle = MOSAIC_SMALL_PER_LARGE + 1;

  const sized = items.map((item, index) => {
    const distanceFromFirst = index - firstLargeAt;
    const isLargeSlot =
      distanceFromFirst >= 0 && distanceFromFirst % cycle === 0;
    const size: CardSize = isLargeSlot ? "2x2" : "1x1";
    return { ...item, size };
  });

  // Regla cola: grande en últimos <TAIL_MIN items se recorre hacia atrás,
  // no se elimina. Preserva conteo 1 grande por ciclo.
  const hasLargeNeighbor = (arr: CardSize[], i: number) =>
    arr[i - 1] === "2x2" || arr[i + 1] === "2x2";
  const sizes = sized.map((item) => item.size as CardSize);
  sized.forEach((item, index) => {
    if (item.size !== "2x2") return;
    const remaining = sized.length - 1 - index;
    if (remaining >= MOSAIC_TAIL_MIN) return;
    for (
      let target = sized.length - 1 - MOSAIC_TAIL_MIN;
      target >= firstLargeAt;
      target--
    ) {
      if (sizes[target] === "2x2" || hasLargeNeighbor(sizes, target)) continue;
      sizes[target] = "2x2";
      sizes[index] = "1x1";
      break;
    }
  });
  return sized.map((item, index) => ({ ...item, size: sizes[index] }));
}
