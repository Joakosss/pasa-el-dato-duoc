"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/constants";
import { usePublicaciones } from "@/hooks/use-publicaciones";
import { buildMosaicLayout } from "@/lib/mosaic/buildMosaicLayout";
import { MOSAIC_SEED } from "@/lib/mosaic/constants";
import { mapearPublicacionesACards } from "@/lib/products";
import { ProductGrid } from "./ProductGrid";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

const CANTIDAD_SKELETON = 20;

export function FeaturedProducts() {
  const { publicaciones, isCargando, error, reintentar } = usePublicaciones();

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

  const items = buildMosaicLayout(mapearPublicacionesACards(publicaciones), {
    seed: MOSAIC_SEED,
  });

  return <ProductGrid items={items} />;
}
