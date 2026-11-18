"use client";

import { create } from "zustand";
import type {
  CategoriaId,
  SedeId,
  TipoVentaId,
} from "@/domain/types/common";
import {
  FILTROS_VACIOS,
  type FiltrosPublicacion,
} from "@/lib/feed/filtrar-publicaciones";

// Filtros de búsqueda del home. Memoria local sin persistencia
// (sin deep-linking URL en esta iteración, según spec).
// Compartido entre la barra desktop y el panel mobile del Navbar.
interface BusquedaState {
  texto: string;
  filtros: FiltrosPublicacion;
  setTexto: (texto: string) => void;
  setCategoria: (categoriaId: CategoriaId | null) => void;
  setFiltros: (filtros: FiltrosPublicacion) => void;
  limpiar: () => void;
}

export const useBusquedaStore = create<BusquedaState>()((set) => ({
  texto: "",
  filtros: FILTROS_VACIOS,
  setTexto: (texto) => set({ texto }),
  setCategoria: (categoriaId) =>
    set((estado) => ({ filtros: { ...estado.filtros, categoriaId } })),
  setFiltros: (filtros) => set({ filtros }),
  limpiar: () => set({ texto: "", filtros: FILTROS_VACIOS }),
}));

export const selectTextoBusqueda = (estado: BusquedaState) => estado.texto;
export const selectFiltrosBusqueda = (estado: BusquedaState) => estado.filtros;
export type { CategoriaId, SedeId, TipoVentaId };
