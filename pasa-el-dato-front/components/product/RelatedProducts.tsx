"use client";

import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { usePublicaciones } from "@/hooks/use-publicaciones";
import { mapearPublicacionesACards } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

interface RelatedProductsProps {
  idActual: string;
  categoriaId: number;
}

// Relacionados heurísticos: misma categoría primero, luego el resto, hasta 4.
export function RelatedProducts({
  idActual,
  categoriaId,
}: RelatedProductsProps) {
  const { publicaciones, isCargando } = usePublicaciones();
  const otras = publicaciones.filter((item) => item.id !== idActual);
  const seleccion = [
    ...otras.filter((item) => item.categoria.id === categoriaId),
    ...otras.filter((item) => item.categoria.id !== categoriaId),
  ].slice(0, 4);

  if (isCargando && publicaciones.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Productos relacionados</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, indice) => (
            <ProductCardSkeleton key={indice} />
          ))}
        </div>
      </section>
    );
  }

  if (seleccion.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">Productos relacionados</h2>
        <Link
          href={ROUTES.home}
          className="text-sm text-gray-500 transition hover:text-gold"
        >
          Ver todo →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {mapearPublicacionesACards(seleccion).map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
