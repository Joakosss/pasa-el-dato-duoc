"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { listarBannersActivosApi } from "@/lib/api/banners";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";

// Banners por consulta: acota el mosaico a patrocinios dispersos
// (interleaveSponsored los reparte con separación de ~6 posiciones).
export const LIMITE_BANNERS_ACTIVOS = 6;

// Banners aprobados y vigentes de mi sede (HU-PU-05-FE01/FE03).
// La sede la resuelve el back desde la cuenta: `sedeNombre` entra en la
// clave solo como señal de cambio para refrescar al cambiar de sede.
export function useBannersActivos() {
  const autenticado = useSesionStore(selectEstaAutenticado);
  const rol = useSesionStore(
    (estado) => estado.sesion?.rol.descripcion ?? null,
  );
  const sedeNombre = useSesionStore(
    (estado) => estado.sesion?.sedeNombre ?? null,
  );

  // Las cuentas de marca no tienen sede asociada: el endpoint responde 403,
  // así que ni siquiera se consulta.
  const esMarca = (rol ?? "").trim().toLowerCase() === "marca";

  const query = useQuery({
    queryKey: ["banners-activos", sedeNombre],
    queryFn: () => listarBannersActivosApi(LIMITE_BANNERS_ACTIVOS),
    enabled: autenticado && !esMarca,
    staleTime: 60_000,
    // 401 (sin sesión) y 403 (cuenta sin sede) no son reintentables.
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    // Conserva los banners ya mostrados al refrescar por cambio de sede.
    placeholderData: keepPreviousData,
  });

  const sinAudiencia =
    query.error instanceof ApiError &&
    (query.error.status === 401 || query.error.status === 403);

  return {
    banners: query.data?.items ?? [],
    // 401/403 no son errores visibles: simplemente no hay banners que
    // mostrar para esta sesión. El catálogo nunca depende de esta query.
    error:
      query.isError && !sinAudiencia
        ? "No pudimos cargar los banners. Reintenta."
        : null,
    reintentar: () => query.refetch(),
  };
}
