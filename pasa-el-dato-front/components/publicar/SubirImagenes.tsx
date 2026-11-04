"use client";

import { useId, useState, type ChangeEvent } from "react";
import { cn } from "@/lib/utils/cn";
import {
  CANTIDAD_MAXIMA_IMAGENES,
  MIMES_IMAGEN_PERMITIDOS,
  TAMANO_MAXIMO_IMAGEN_BYTES,
} from "@/lib/publicar/validacion";

interface SubirImagenesProps {
  imagenes: File[];
  urls: string[];
  fotoActiva: number;
  onCambiar: (imagenes: File[]) => void;
  onSeleccionarActiva: (indice: number) => void;
  error?: string;
}

export function SubirImagenes({
  imagenes,
  urls,
  fotoActiva,
  onCambiar,
  onSeleccionarActiva,
  error,
}: SubirImagenesProps) {
  const inputId = useId();
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const alSeleccionar = (evento: ChangeEvent<HTMLInputElement>) => {
    const seleccionadas = Array.from(evento.target.files ?? []);
    // Permite volver a elegir el mismo archivo después de quitarlo.
    evento.target.value = "";
    if (seleccionadas.length === 0) return;

    const validas = seleccionadas.filter(
      (imagen) =>
        MIMES_IMAGEN_PERMITIDOS.includes(
          imagen.type as (typeof MIMES_IMAGEN_PERMITIDOS)[number],
        ) && imagen.size <= TAMANO_MAXIMO_IMAGEN_BYTES,
    );

    let mensaje: string | null = null;
    if (validas.length < seleccionadas.length) {
      mensaje =
        "Se omitieron imágenes que no son JPEG, PNG o WebP o que superan 5 MB.";
    }

    const combinadas = [...imagenes, ...validas];
    if (combinadas.length > CANTIDAD_MAXIMA_IMAGENES) {
      mensaje = `Puedes subir hasta ${CANTIDAD_MAXIMA_IMAGENES} imágenes.`;
    }

    setErrorLocal(mensaje);
    onCambiar(combinadas.slice(0, CANTIDAD_MAXIMA_IMAGENES));
  };

  const quitar = (indice: number) => {
    setErrorLocal(null);
    onCambiar(imagenes.filter((_, posicion) => posicion !== indice));
  };

  const mensajeError = error ?? errorLocal;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-navy">
        Fotos
      </label>
      <input
        id={inputId}
        type="file"
        accept={MIMES_IMAGEN_PERMITIDOS.join(",")}
        multiple
        onChange={alSeleccionar}
        className="block w-full cursor-pointer rounded-xl border border-gray-200 bg-white text-sm text-navy file:mr-3 file:cursor-pointer file:rounded-l-xl file:border-0 file:bg-surface file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-navy hover:file:bg-gold/10"
      />
      <p className="text-xs text-gray-500">
        De 1 a {CANTIDAD_MAXIMA_IMAGENES} imágenes (JPEG, PNG o WebP, máx.
        5 MB). La primera será la principal.
      </p>

      {urls.length > 0 ? (
        <div
          className="grid grid-cols-4 gap-2"
          role="group"
          aria-label="Imágenes seleccionadas"
        >
          {urls.map((url, indice) => (
            <div key={url} className="relative">
              <button
                type="button"
                onClick={() => onSeleccionarActiva(indice)}
                aria-label={`Marcar imagen ${indice + 1} como principal`}
                aria-pressed={indice === fotoActiva}
                className={cn(
                  "block w-full cursor-pointer overflow-hidden rounded-lg border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  indice === fotoActiva
                    ? "border-gold ring-2 ring-gold/40"
                    : "border-gray-200 hover:border-gold",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Imagen ${indice + 1}`}
                  className="h-16 w-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => quitar(indice)}
                aria-label={`Quitar imagen ${indice + 1}`}
                className="absolute -right-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-navy text-xs font-bold text-white transition hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {mensajeError ? (
        <span className="text-sm text-red-500">{mensajeError}</span>
      ) : null}
    </div>
  );
}
