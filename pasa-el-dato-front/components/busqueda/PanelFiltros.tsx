"use client";

import { useEffect, useRef, useState } from "react";
import { useCategorias } from "@/hooks/use-categorias";
import { useSedes } from "@/hooks/use-sedes";
import { useTipoventas } from "@/hooks/use-tipoventas";
import {
  formatoPrecio,
  monto,
  type FiltrosPublicacion,
} from "@/lib/feed/filtrar-publicaciones";
import { cn } from "@/lib/utils/cn";

interface PanelFiltrosProps {
  abierto: boolean;
  filtros: FiltrosPublicacion;
  onCerrar: () => void;
  onAplicar: (filtros: FiltrosPublicacion) => void;
}

export function PanelFiltros({
  abierto,
  filtros,
  onCerrar,
  onAplicar,
}: PanelFiltrosProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    panelRef.current?.focus();
    const alTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclar);
    return () => window.removeEventListener("keydown", alTeclar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <ContenidoFiltros
      filtros={filtros}
      panelRef={panelRef}
      onCerrar={onCerrar}
      onAplicar={onAplicar}
    />
  );
}

function ContenidoFiltros({
  filtros,
  panelRef,
  onCerrar,
  onAplicar,
}: {
  filtros: FiltrosPublicacion;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onCerrar: () => void;
  onAplicar: (filtros: FiltrosPublicacion) => void;
}) {
  const { categorias } = useCategorias();
  const { sedes } = useSedes();
  const { tipoventas } = useTipoventas();
  // Se monta solo al abrir: el inicializador corre con los filtros
  // aplicados vigentes, sin sincronizar estado dentro de un efecto.
  const [borrador, setBorrador] = useState<FiltrosPublicacion>(filtros);

  const minimo = monto(borrador.precioMinimo);
  const maximo = monto(borrador.precioMaximo);
  const errorPrecio =
    minimo !== null && maximo !== null && minimo > maximo
      ? "El precio mínimo no puede superar el máximo."
      : null;

  const aplicar = () => {
    if (errorPrecio) return;
    onAplicar(borrador);
    onCerrar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filtrar publicaciones"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full flex-col rounded-t-2xl border border-gray-200 bg-card shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-navy">
              Filtrar publicaciones
            </h2>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Todos los filtros son opcionales.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar filtros"
            onClick={onCerrar}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-navy transition hover:bg-gray-100"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          <SeccionOpciones
            titulo="Categoría"
            opciones={categorias}
            seleccionadoId={borrador.categoriaId}
            onSeleccionar={(categoriaId) =>
              setBorrador((actual) => ({ ...actual, categoriaId }))
            }
          />
          <SeccionOpciones
            titulo="Sede"
            opciones={sedes}
            seleccionadoId={borrador.sedeId}
            onSeleccionar={(sedeId) =>
              setBorrador((actual) => ({ ...actual, sedeId }))
            }
          />
          <SeccionOpciones
            titulo="Tipo de venta"
            opciones={tipoventas}
            seleccionadoId={borrador.tipoVentaId}
            onSeleccionar={(tipoVentaId) =>
              setBorrador((actual) => ({ ...actual, tipoVentaId }))
            }
          />

          <p className="mb-2 text-[15px] font-bold text-navy">Rango de precio</p>
          <div className="flex items-center gap-1.5">
            <label className="flex min-h-[44px] flex-1 items-center gap-1 rounded-xl border border-gray-200 bg-surface px-3">
              <span className="font-bold text-gray-500" aria-hidden="true">
                $
              </span>
              <input
                value={borrador.precioMinimo}
                onChange={(e) =>
                  setBorrador((actual) => ({
                    ...actual,
                    precioMinimo: formatoPrecio(e.target.value),
                  }))
                }
                inputMode="numeric"
                placeholder="Mínimo"
                aria-label="Precio mínimo"
                className="w-full bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-gray-300"
              />
            </label>
            <span className="text-gray-500" aria-hidden="true">
              —
            </span>
            <label className="flex min-h-[44px] flex-1 items-center gap-1 rounded-xl border border-gray-200 bg-surface px-3">
              <span className="font-bold text-gray-500" aria-hidden="true">
                $
              </span>
              <input
                value={borrador.precioMaximo}
                onChange={(e) =>
                  setBorrador((actual) => ({
                    ...actual,
                    precioMaximo: formatoPrecio(e.target.value),
                  }))
                }
                inputMode="numeric"
                placeholder="Máximo"
                aria-label="Precio máximo"
                className="w-full bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-gray-300"
              />
            </label>
          </div>
          {errorPrecio ? (
            <p role="alert" className="mt-1 text-xs text-red-500">
              {errorPrecio}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2.5 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={() =>
              setBorrador({
                categoriaId: null,
                sedeId: null,
                tipoVentaId: null,
                precioMinimo: "",
                precioMaximo: "",
              })
            }
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-navy transition hover:border-gold"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={aplicar}
            className="flex min-h-[44px] flex-[2] cursor-pointer items-center justify-center rounded-xl bg-gold text-sm font-extrabold text-navy transition hover:bg-gold-hover"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}

function SeccionOpciones({
  titulo,
  opciones,
  seleccionadoId,
  onSeleccionar,
}: {
  titulo: string;
  opciones: Array<{ id: number; nombre: string }>;
  seleccionadoId: number | null;
  onSeleccionar: (id: number | null) => void;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-[15px] font-bold text-navy">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={seleccionadoId === null}
          onClick={() => onSeleccionar(null)}
          className={cn(
            "min-h-[36px] cursor-pointer rounded-full border px-3 py-2 text-[13px] font-semibold transition",
            seleccionadoId === null
              ? "border-navy bg-navy text-gold"
              : "border-gray-200 bg-surface text-navy hover:border-gold",
          )}
        >
          Cualquiera
        </button>
        {opciones.map((opcion) => {
          const activa = seleccionadoId === opcion.id;
          return (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={activa}
              onClick={() => onSeleccionar(opcion.id)}
              className={cn(
                "min-h-[36px] cursor-pointer rounded-full border px-3 py-2 text-[13px] font-semibold transition",
                activa
                  ? "border-navy bg-navy text-gold"
                  : "border-gray-200 bg-surface text-navy hover:border-gold",
              )}
            >
              {opcion.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
