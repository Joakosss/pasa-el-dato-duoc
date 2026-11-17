"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/constants";
import { usePublicaciones } from "@/hooks/use-publicaciones";
import { useBannersActivos } from "@/hooks/use-banners-activos";
import { buildMosaicLayout } from "@/lib/mosaic/buildMosaicLayout";
import { interleaveSponsored } from "@/lib/mosaic/sponsor";
import { MOSAIC_SEED } from "@/lib/mosaic/constants";
import {
  mapearBannersACards,
  mapearPublicacionesACards,
} from "@/lib/products";
import { ProductGrid } from "./ProductGrid";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

const CANTIDAD_SKELETON = 20;

export function FeaturedProducts() {
  const { publicaciones, isCargando, error, reintentar } = usePublicaciones();
  // Banners en mejor esfuerzo (HU-PU-05): un fallo no debe romper el
  // catálogo, por eso su `error` no se muestra en pantalla.
  const { banners } = useBannersActivos();

  if (isCargando && publicaciones.length === 0) {
    return <ProductGridSkeleton count={CANTIDAD_SKELETON} />;
  }

  if (error && publicaciones.length === 0) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-gray-200 bg-card p-6 text-center"
      >
        <p className="text-sm text-gray-500">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => reintentar()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (publicaciones.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-card p-6 text-center">
        <p className="text-sm text-gray-500">
          Aún no hay publicaciones. ¡Sé el primero en publicar!
        </p>
        <Link
          href={ROUTES.publish}
          className="mt-3 inline-block text-sm font-semibold text-navy transition hover:text-gold"
        >
          Publicar ahora →
        </Link>
      </div>
    );
  }

  // Primero el layout (asigna los tamaños 2x2 a productos) y después el
  // intercalado de patrocinios: los tamaños viajan en cada item.
  const mosaico = buildMosaicLayout(mapearPublicacionesACards(publicaciones), {
    seed: MOSAIC_SEED,
  });
  const items = interleaveSponsored(mosaico, mapearBannersACards(banners));

  return <ProductGrid items={items} />;
}
