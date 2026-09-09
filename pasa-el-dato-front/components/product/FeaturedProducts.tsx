import { ProductGrid } from "./ProductGrid";
import { buildMosaicLayout } from "@/lib/mosaic/buildMosaicLayout";
import { interleaveSponsored, SPONSOR_SEED } from "@/lib/mosaic/sponsor";
import { MOSAIC_SEED } from "@/lib/mosaic/constants";
import { getFeaturedPage } from "@/lib/products";

export async function FeaturedProducts({ page }: { page: number }) {
  const { items, sponsored } = await getFeaturedPage(page);

  const mosaicItems = buildMosaicLayout(
    interleaveSponsored(items, sponsored, { seed: SPONSOR_SEED }),
    { seed: MOSAIC_SEED },
  );

  return <ProductGrid items={mosaicItems} />;
}
