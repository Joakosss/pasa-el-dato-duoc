"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import {
  aprobarBannerApi,
  listarBannersAdminApi,
  rechazarBannerApi,
} from "@/lib/api/banners-admin";
import type { EstadoBannerDTO } from "@/domain/dtos/banner.dto";

// Clave base del listado admin: cualquier resolución la invalida para que
// el panel refresque con el banner fuera de PENDIENTE.
export const CLAVE_BANNERS_ADMIN = ["banners-admin"] as const;

function mensajeErrorListado(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (error.status === 403) return "Tu sesión no tiene permisos para ver los banners.";
  }
  return "No pudimos cargar los banners. Reintenta.";
}

// Listado paginado de banners por estado (HU-PU-02-FE01).
export function useBannersAdmin(
  estado: EstadoBannerDTO,
  page: number,
  pageSize: number,
) {
  const query = useQuery({
    queryKey: [...CLAVE_BANNERS_ADMIN, estado, page, pageSize],
    queryFn: () => listarBannersAdminApi({ estado, page, pageSize }),
    // Sesión inválida o sin permisos no se reintenta: el mensaje es final.
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }
      return failureCount < 1;
    },
    // Conserva la página anterior al cambiar de página o filtro.
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  return {
    pagina: query.data ?? null,
    isCargando: query.isPending,
    error: query.isError ? mensajeErrorListado(query.error) : null,
    reintentar: () => query.refetch(),
  };
}

// Aprueba un banner pendiente (HU-PU-02-FE02).
export function useAprobarBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: aprobarBannerApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_BANNERS_ADMIN });
    },
  });
}

// Rechaza un banner pendiente con motivo y notifica a la marca.
export function useRechazarBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entrada: { id: string; motivo: string }) =>
      rechazarBannerApi(entrada.id, { motivo: entrada.motivo }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLAVE_BANNERS_ADMIN });
    },
  });
}
