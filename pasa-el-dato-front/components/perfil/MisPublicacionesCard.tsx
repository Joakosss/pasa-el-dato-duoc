"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { PublicacionListaDTO } from "@/domain/dtos/publicacion.dto";
import { resolverUrlApi } from "@/lib/api/urls";
import { formatearPrecioCLP } from "@/lib/utils/format";

interface MisPublicacionesCardProps {
  publicacion: PublicacionListaDTO;
}

type VarianteEstado = "active" | "review" | "category";

function varianteEstado(estado: string): VarianteEstado {
  if (estado === "Pausada") return "review";
  if (estado === "Vendida") return "category";
  return "active";
}

function imagenRepresentativa(
  publicacion: PublicacionListaDTO,
): { url: string } | null {
  if (publicacion.imagenes.length === 0) return null;

  const [primera] = [...publicacion.imagenes].sort(
    (a, b) => a.orden - b.orden,
  );
  return primera ? { url: primera.url } : null;
}

export function MisPublicacionesCard({
  publicacion,
}: MisPublicacionesCardProps) {
  const [errorImagen, setErrorImagen] = useState(false);
  const imagen = imagenRepresentativa(publicacion);
  const mostrarImagen = Boolean(imagen) && !errorImagen;

  return (
    <Link
      href={`/product/${publicacion.id}`}
      className="card-hover flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-card"
    >
      <div className="relative">
        {mostrarImagen && imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolverUrlApi(imagen.url)}
            alt={publicacion.titulo}
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
          <Badge variant={varianteEstado(publicacion.estado.descripcion)}>
            {publicacion.estado.descripcion}
          </Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col border-t border-gray-100 p-3">
        <h2 className="mb-1 line-clamp-2 text-sm font-semibold leading-tight text-navy">
          {publicacion.titulo}
        </h2>
        <p className="mb-2 text-xs text-gray-500">
          {publicacion.sede.nombre} · {publicacion.tipoVenta.nombre}
        </p>
        <p className="mt-auto text-base font-bold text-navy">
          {formatearPrecioCLP(publicacion.precio)}
        </p>
      </div>
    </Link>
  );
}
