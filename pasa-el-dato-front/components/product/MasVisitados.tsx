"use client";

import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { useMasVisitados } from "@/hooks/use-mas-visitados";
import { mapearPublicacionesACards } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

interface MasVisitadosProps {
  idActual: string;
}

// Más visitados: orden del back (vistas desc), excluye el actual, hasta 4.
// Mejor esfuerzo: en error o vacío no renderiza para no romper el detalle.
export function MasVisitados({ idActual }: MasVisitadosProps) {
  const { publicaciones, isCargando } = useMasVisitados();
  const seleccion = publicaciones
    .filter((item) => item.id !== idActual)
    .slice(0, 4);

  if (isCargando && publicaciones.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Más visitados</h2>
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
        <h2 className="text-lg font-bold text-navy">Más visitados</h2>
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
