"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/constants";
import { ResumenResultados } from "@/components/busqueda/ResumenResultados";
import { usePublicaciones } from "@/hooks/use-publicaciones";
import { useBannersActivos } from "@/hooks/use-banners-activos";
import { buildMosaicLayout } from "@/lib/mosaic/buildMosaicLayout";
import { interleaveSponsored } from "@/lib/mosaic/sponsor";
import { MOSAIC_SEED } from "@/lib/mosaic/constants";
import {
  filtrarPublicaciones,
  hayFiltrosActivos,
} from "@/lib/feed/filtrar-publicaciones";
import {
  mapearBannersACards,
  mapearPublicacionesACards,
} from "@/lib/products";
import {
  selectFiltrosBusqueda,
  selectTextoBusqueda,
  useBusquedaStore,
} from "@/stores/busqueda-store";
import { ProductGrid } from "./ProductGrid";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

const CANTIDAD_SKELETON = 20;

export function FeaturedProducts() {
  const { publicaciones, isCargando, error, reintentar } = usePublicaciones();
  // Banners en mejor esfuerzo (HU-PU-05): un fallo no debe romper el
  // catálogo, por eso su `error` no se muestra en pantalla.
  const { banners } = useBannersActivos();
  const texto = useBusquedaStore(selectTextoBusqueda);
  const filtros = useBusquedaStore(selectFiltrosBusqueda);

  const filtradas = useMemo(
    () => filtrarPublicaciones(publicaciones, texto, filtros),
    [publicaciones, texto, filtros],
  );
  const hayFiltros = hayFiltrosActivos(texto, filtros);
  const limpiar = () => useBusquedaStore.getState().limpiar();

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

  if (filtradas.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <ResumenResultados
          total={0}
          hayFiltros={hayFiltros}
          onLimpiar={limpiar}
        />
        <div className="rounded-xl border border-gray-200 bg-card p-6 text-center">
          <p className="text-base font-bold text-navy">Sin resultados</p>
          <p className="mt-1 text-sm text-gray-500">
            No encontramos publicaciones con esos criterios. Prueba con otros
            filtros.
          </p>
          {hayFiltros ? (
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              onClick={limpiar}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  // Primero el layout (asigna los tamaños 2x2 a productos) y después el
  // intercalado de patrocinios: los tamaños viajan en cada item.
  // Se filtra el subconjunto visible; el mosaico/grid no se modifica.
  const mosaico = buildMosaicLayout(mapearPublicacionesACards(filtradas), {
    seed: MOSAIC_SEED,
  });
  const items = interleaveSponsored(mosaico, mapearBannersACards(banners));

  return (
    <div className="flex flex-col gap-3">
      <ResumenResultados
        total={filtradas.length}
        hayFiltros={hayFiltros}
        onLimpiar={limpiar}
      />
      <ProductGrid items={items} />
    </div>
  );
}
