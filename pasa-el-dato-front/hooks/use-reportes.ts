"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  CrearReportePublicacionRequestDTO,
  CrearReporteUsuarioRequestDTO,
} from "@/domain/dtos/reporte.dto";
import {
  crearReportePublicacion,
  crearReporteUsuario,
  listarMotivosReporte,
  listarMotivosReporteUsuario,
} from "@/lib/api/reportes";

// HU-REP-01: catálogo de motivos para el selector del formulario.
export function useMotivosReporte() {
  const query = useQuery({
    queryKey: ["motivos-reporte"],
    queryFn: listarMotivosReporte,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    motivos: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError
      ? "No pudimos cargar los motivos de reporte. Reintenta."
      : null,
    reintentar: query.refetch,
  };
}

// HU-REP-02: catálogo de motivos para el selector del formulario.
export function useMotivosReporteUsuario() {
  const query = useQuery({
    queryKey: ["motivos-reporte-usuario"],
    queryFn: listarMotivosReporteUsuario,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    motivos: query.data ?? [],
    isCargando: query.isPending || query.isFetching,
    error: query.isError
      ? "No pudimos cargar los motivos de reporte. Reintenta."
      : null,
    reintentar: query.refetch,
  };
}

// HU-REP-01: creación sin optimismo; el 409 de duplicado lo decide el componente.
export function useCrearReportePublicacion() {
  return useMutation({
    mutationFn: (dto: CrearReportePublicacionRequestDTO) =>
      crearReportePublicacion(dto),
  });
}

// HU-REP-02: creación sin optimismo; el 409 de duplicado lo decide el componente.
export function useCrearReporteUsuario() {
  return useMutation({
    mutationFn: (dto: CrearReporteUsuarioRequestDTO) =>
      crearReporteUsuario(dto),
  });
}
