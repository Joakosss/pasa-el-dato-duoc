"use client";

import { useEffect, useState } from "react";
import { PanelFiltros } from "@/components/busqueda/PanelFiltros";
import { useCategorias } from "@/hooks/use-categorias";
import { hayFiltrosActivos } from "@/lib/feed/filtrar-publicaciones";
import { cn } from "@/lib/utils/cn";
import {
  selectFiltrosBusqueda,
  selectTextoBusqueda,
  useBusquedaStore,
} from "@/stores/busqueda-store";

type SearchBarProps = {
  id?: string;
  variant?: "bar" | "panel";
  open?: boolean;
  onClose?: () => void;
  autoFocusInput?: boolean;
};

export function SearchBar({
  id = "search",
  variant = "bar",
  open,
  onClose,
  autoFocusInput,
}: SearchBarProps) {
  const texto = useBusquedaStore(selectTextoBusqueda);
  const filtros = useBusquedaStore(selectFiltrosBusqueda);
  const { categorias } = useCategorias();
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    if (variant !== "panel" || !open || !onClose) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [variant, open, onClose]);

  const hayFiltros = hayFiltrosActivos(texto, filtros);

  const contenido = (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 transition focus-within:border-transparent focus-within:ring-2 focus-within:ring-gold">
          <svg
            className="h-[18px] w-[18px] shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id={`${id}-q`}
            type="text"
            value={texto}
            onChange={(e) =>
              useBusquedaStore.getState().setTexto(e.target.value)
            }
            placeholder="Buscar libros, electrónica, servicios..."
            aria-label="Buscar publicaciones"
            autoFocus={autoFocusInput}
            className="w-full min-w-0 bg-transparent py-2 text-sm text-navy outline-none placeholder:text-gray-300"
          />
          {texto.length > 0 ? (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => useBusquedaStore.getState().setTexto("")}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition hover:text-navy"
            >
              <svg
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="Abrir filtros"
          onClick={() => setModalAbierto(true)}
          className="relative flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-navy transition hover:opacity-90"
        >
          <svg
            className="h-5 w-5 text-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M7 12h10M10 18h4"
            />
          </svg>
          {hayFiltros ? (
            <span
              aria-hidden="true"
              className="absolute right-[3px] top-[3px] h-[10px] w-[10px] rounded-full border border-white bg-gold"
            />
          ) : null}
        </button>
      </div>

      <div
        role="group"
        aria-label="Filtrar por categoría"
        className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1"
      >
        <button
          type="button"
          aria-pressed={filtros.categoriaId === null}
          onClick={() => useBusquedaStore.getState().setCategoria(null)}
          className={cn(
            "flex min-h-[36px] shrink-0 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-semibold transition",
            filtros.categoriaId === null
              ? "border-navy bg-navy text-gold"
              : "border-gray-200 bg-white text-navy hover:border-gold",
          )}
        >
          Todas
        </button>
        {categorias.map((categoria) => {
          const activa = filtros.categoriaId === categoria.id;
          return (
            <button
              key={categoria.id}
              type="button"
              aria-pressed={activa}
              onClick={() =>
                useBusquedaStore.getState().setCategoria(categoria.id)
              }
              className={cn(
                "flex min-h-[36px] shrink-0 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-semibold transition",
                activa
                  ? "border-navy bg-navy text-gold"
                  : "border-gray-200 bg-white text-navy hover:border-gold",
              )}
            >
              {categoria.nombre}
            </button>
          );
        })}
      </div>

      <PanelFiltros
        abierto={modalAbierto}
        filtros={filtros}
        onCerrar={() => setModalAbierto(false)}
        onAplicar={(siguiente) =>
          useBusquedaStore.getState().setFiltros(siguiente)
        }
      />
    </>
  );

  if (variant === "panel") {
    if (!open) return null;
    return (
      <section
        id={id}
        aria-label="Búsqueda"
        className="absolute inset-x-0 top-full z-40 border-b border-gray-200 bg-white shadow-lg sm:hidden"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3">
          {contenido}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Búsqueda"
      className="sticky top-16 z-40 border-b border-gray-200 bg-surface"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6 lg:px-8">
        {contenido}
      </div>
    </section>
  );
}
