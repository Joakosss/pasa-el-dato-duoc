"use client";

import { useMutation } from "@tanstack/react-query";
import { crearMarcaAdminApi } from "@/lib/api/marcas";

// Creación de cuenta de marca autorizada desde el panel de administración.
export function useCrearMarcaAdmin() {
  return useMutation({
    mutationFn: crearMarcaAdminApi,
  });
}
