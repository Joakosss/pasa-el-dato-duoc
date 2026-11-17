"use client";

import { useId, useMemo, useState, type ChangeEvent } from "react";
import { useUrlsImagenes } from "@/hooks/use-urls-imagenes";
import {
  MIMES_IMAGEN_PERMITIDOS,
  TAMANO_MAXIMO_IMAGEN_BYTES,
} from "@/lib/publicar/validacion";

interface SubirImagenBannerProps {
  imagen: File | null;
  onCambiar: (imagen: File | null) => void;
  error?: string;
}

// Selector de la única imagen del banner: mismas reglas que el back valida
// en POST /publicidad/banners (JPEG, PNG o WebP, máximo 5 MB).
export function SubirImagenBanner({
  imagen,
  onCambiar,
  error,
}: SubirImagenBannerProps) {
  const inputId = useId();
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Estabiliza la referencia para que useUrlsImagenes solo regenere la URL
  // de vista previa cuando cambia el archivo, no en cada render.
  const imagenes = useMemo(() => (imagen ? [imagen] : []), [imagen]);
  const urls = useUrlsImagenes(imagenes);

  const alSeleccionar = (evento: ChangeEvent<HTMLInputElement>) => {
    const seleccionada = Array.from(evento.target.files ?? [])[0];
    // Permite volver a elegir el mismo archivo después de quitarlo.
    evento.target.value = "";
    if (!seleccionada) return;

    const tipoValido = MIMES_IMAGEN_PERMITIDOS.includes(
      seleccionada.type as (typeof MIMES_IMAGEN_PERMITIDOS)[number],
    );
    if (!tipoValido || seleccionada.size > TAMANO_MAXIMO_IMAGEN_BYTES) {
      setErrorLocal("La imagen debe ser JPEG, PNG o WebP y pesar máximo 5 MB.");
      return;
    }

    setErrorLocal(null);
    onCambiar(seleccionada);
  };

  const quitar = () => {
    setErrorLocal(null);
    onCambiar(null);
  };

  const mensajeError = error ?? errorLocal ?? undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-navy">
        Imagen del banner
      </label>
      <input
        id={inputId}
        type="file"
        accept={MIMES_IMAGEN_PERMITIDOS.join(",")}
        onChange={alSeleccionar}
        className="block w-full cursor-pointer rounded-xl border border-gray-200 bg-white text-sm text-navy file:mr-3 file:cursor-pointer file:rounded-l-xl file:border-0 file:bg-surface file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-navy hover:file:bg-gold/10"
      />
      <p className="text-xs text-gray-500">JPEG, PNG o WebP, máximo 5 MB.</p>

      {urls.length > 0 ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[0]}
            alt="Vista previa de la imagen del banner"
            className="max-h-48 w-full object-contain"
          />
          <button
            type="button"
            onClick={quitar}
            className="absolute right-2 top-2 cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy shadow transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Quitar
          </button>
        </div>
      ) : null}

      {mensajeError ? (
        <span className="text-sm text-red-500">{mensajeError}</span>
      ) : null}
    </div>
  );
}
