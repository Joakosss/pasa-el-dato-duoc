"use client";

import { useEffect, useState } from "react";

// Genera URLs de objeto para las imágenes seleccionadas y las revoca al
// cambiar el array o desmontar. Se hace dentro de useEffect para que
// StrictMode (doble montaje en dev) vuelva a crearlas tras el cleanup.
export function useUrlsImagenes(imagenes: File[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const nuevas = imagenes.map((imagen) => URL.createObjectURL(imagen));
    // Sincroniza URLs externas con el ciclo de vida del efecto; no hay forma
    // pura de crear objetos URL ligados a File.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(nuevas);

    return () => {
      nuevas.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagenes]);

  return urls;
}
