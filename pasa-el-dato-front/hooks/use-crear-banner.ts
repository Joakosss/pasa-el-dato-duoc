"use client";

import { useMutation } from "@tanstack/react-query";
import { crearBannerApi } from "@/lib/api/banners";

// Creación de banner publicitario (HU-PU-01) desde el portal de marca.
// En éxito el back devuelve el banner en estado PENDIENTE.
export function useCrearBanner() {
  return useMutation({
    mutationFn: crearBannerApi,
  });
}
