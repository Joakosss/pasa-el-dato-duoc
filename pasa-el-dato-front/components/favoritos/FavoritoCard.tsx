"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { FavoritoDTO } from "@/domain/dtos";
import { resolverUrlApi } from "@/lib/api/urls";
import { formatearPrecioCLP } from "@/lib/utils/format";

type VarianteEstado = "active" | "review" | "category" | "reported";

function varianteEstado(descripcion: string): VarianteEstado {
  if (descripcion === "No disponible") return "reported";
  if (descripcion === "Pausada" || descripcion === "Pausado") return "review";
  if (descripcion === "Vendida" || descripcion === "Vendido") return "category";
  return "active";
}

function imagenRepresentativa(favorito: FavoritoDTO): { url: string } | null {
  const ordenadas = [...favorito.imagenes].sort((a, b) => a.orden - b.orden);
  const [primera] = ordenadas;
  return primera ? { url: primera.url } : null;
}

// Tarjeta de favorito (S9.3): mismo lenguaje que MisPublicacionesCard.
// S9.4: `disponible: false` no navega al producto y lo indica con badge.
export function FavoritoCard({ favorito }: { favorito: FavoritoDTO }) {
  const [errorImagen, setErrorImagen] = useState(false);
  const imagen = imagenRepresentativa(favorito);
  const mostrarImagen = Boolean(imagen) && !errorImagen;

  const contenido = (
    <>
      <div className="relative">
        {mostrarImagen && imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolverUrlApi(imagen.url)}
            alt={favorito.titulo}
            onError={() => setErrorImagen(true)}
            className="h-44 w-full bg-gray-200 object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label="Imagen no disponible"
            className="flex h-44 w-full items-center justify-center bg-gray-200 text-xs text-gray-400"
          >
            Sin imagen
          </div>
        )}
        <span className="absolute left-2 top-2">
          <Badge
            variant={
              favorito.disponible
                ? varianteEstado(favorito.estado.descripcion)
                : "reported"
            }
          >
            {favorito.disponible
              ? favorito.estado.descripcion
              : "No disponible"}
          </Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col border-t border-gray-100 p-3">
        <h2 className="mb-1 line-clamp-2 text-sm font-semibold leading-tight text-navy">
          {favorito.titulo}
        </h2>
        <p className="mb-2 text-xs text-gray-500">
          {favorito.sede.nombre} · {favorito.tipoVenta.nombre}
        </p>
        <p className="mt-auto text-base font-bold text-navy">
          {formatearPrecioCLP(favorito.precio)}
        </p>
      </div>
    </>
  );

  if (!favorito.disponible) {
    return (
      <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-card opacity-70">
        {contenido}
      </article>
    );
  }

  return (
    <Link
      href={`/product/${favorito.id}`}
      className="card-hover flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-card"
    >
      {contenido}
    </Link>
  );
}
