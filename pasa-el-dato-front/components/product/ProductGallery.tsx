"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { resolverUrlApi } from "@/lib/api/urls";
import type { ImagenPublicacionCreadaDTO } from "@/domain/dtos/publicacion.dto";

interface ProductGalleryProps {
  imagenes: ImagenPublicacionCreadaDTO[];
  titulo: string;
}

export function ProductGallery({ imagenes, titulo }: ProductGalleryProps) {
  const ordenadas = [...imagenes].sort((a, b) => a.orden - b.orden);
  const [seleccionada, setSeleccionada] = useState(0);
  const indiceActivo = Math.min(
    seleccionada,
    Math.max(ordenadas.length - 1, 0),
  );
  const imagenActiva = ordenadas[indiceActivo];

  return (
    <div className="mb-6 flex h-auto flex-col gap-3 sm:h-[70vh] sm:flex-row">
      <div className="relative h-72 w-full overflow-hidden rounded-xl border border-gray-200 bg-card sm:h-full sm:w-4/5">
        {imagenActiva ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolverUrlApi(imagenActiva.url)}
            alt={titulo}
            className="h-full w-full bg-white object-contain"
          />
        ) : (
          <div
            role="img"
            aria-label="La publicación no tiene imágenes"
            className="h-full w-full bg-gray-200"
          />
        )}
      </div>

      {ordenadas.length > 1 ? (
        <div className="flex h-20 w-full flex-row gap-2 sm:h-full sm:w-1/5 sm:flex-col">
          {ordenadas.map((imagen, indice) => (
            <button
              key={imagen.idImagen}
              type="button"
              onClick={() => setSeleccionada(indice)}
              aria-label={`Ver imagen ${indice + 1}`}
              aria-pressed={indice === indiceActivo}
              className={cn(
                "flex-1 cursor-pointer overflow-hidden rounded-lg border-2 bg-gray-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                indice === indiceActivo
                  ? "border-gold"
                  : "border-gray-200 hover:border-gold",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolverUrlApi(imagen.url)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
